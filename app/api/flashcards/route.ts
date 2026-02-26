import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;

const DIDACTIC_RULES = `
REGOLE TASSATIVE: Crea flashcard SOLO su contenuti DIDATTICI (definizioni, concetti, formule, teoremi, regole, argomenti di studio). ESCLUDI saluti, chiacchiere e messaggi senza contenuto didattico.`;

const LATEX_RULES = `
FORMATO MATEMATICO OBBLIGATORIO:
- Ogni formula/equazione deve essere scritta in LaTeX.
- Inline: usa SEMPRE \\( ... \\), esempio: \\(v = \\frac{2\\pi r}{T}\\).
- Display: usa $$ ... $$ solo se serve una formula su riga separata.
- Non usare formule in testo plain (es. "v = 2πr / T"): convertile in LaTeX.
- Usa comandi LaTeX standard: \\frac{}{}, \\sqrt{}, ^{}, _{}, \\pi, \\omega, \\Delta.
- JSON valido obbligatorio: dentro le stringhe JSON, i backslash devono essere escape-ati (es. \\\\( ... \\\\), \\\\frac).`;

const flashcardPrompt = (input: { content?: string; topic?: string; chatContext?: string }) => {
  if (input.content) {
    const chatAdd = input.chatContext
      ? `\n\nDiscussione nella chat (usa SOLO i concetti didattici emersi):\n"""\n${input.chatContext.slice(0, 4000)}\n"""`
      : "";
    return `Genera 5-10 flashcard didattiche dal materiale caricato (file/PDF) e dalla discussione. Ogni flashcard deve avere:
- front: SEMPRE una domanda (breve, max 2 righe, deve terminare con ?)
- back: SEMPRE una risposta/esempio/spiegazione (2-5 righe)

Materiale (file/PDF):
"""
${input.content.slice(0, 12000)}
"""
${chatAdd}
${DIDACTIC_RULES}
${LATEX_RULES}

Rispondi SOLO con un JSON valido nel formato: {"flashcards":[{"front":"...","back":"..."},{"front":"...","back":"..."}]}
Niente altro testo prima o dopo il JSON. Usa \\n per a capo nel back se necessario.`;
  }
  if (input.chatContext) {
    return `Conversazione studente-mentor. Estrai SOLO i contenuti DIDATTICI (definizioni, concetti, formule, esercizi discussi, argomenti di studio). Genera 5-10 flashcard.

Conversazione:
"""
${input.chatContext.slice(0, 8000)}
"""
${DIDACTIC_RULES}
${LATEX_RULES}

Ogni flashcard: front SEMPRE domanda (max 2 righe, con ?), back SEMPRE risposta/spiegazione (2-5 righe). Escludi saluti e chiacchiere fuori tema.

Rispondi SOLO con un JSON valido nel formato: {"flashcards":[{"front":"...","back":"..."},{"front":"...","back":"..."}]}
Niente altro testo prima o dopo il JSON. Usa \\n per a capo nel back se necessario.`;
  }
  if (input.topic) {
    return `Genera 5-10 flashcard didattiche sull'argomento: "${input.topic}".
Le flashcard devono coprire i concetti chiave dell'argomento per uno studente italiano.
Ogni flashcard: front SEMPRE domanda (max 2 righe, con ?), back SEMPRE risposta/spiegazione (2-5 righe).
${LATEX_RULES}

Rispondi SOLO con un JSON valido nel formato: {"flashcards":[{"front":"...","back":"..."},{"front":"...","back":"..."}]}
Niente altro testo prima o dopo il JSON. Usa \\n per a capo nel back se necessario.`;
  }
  return null;
};

function normalizeMathSymbols(value: string): string {
  return value
    .replace(/π/g, "\\pi")
    .replace(/ω/g, "\\omega")
    .replace(/Δ/g, "\\Delta")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/θ/g, "\\theta");
}

function looksLikeMathLine(line: string): boolean {
  // Match only strong math signals; avoid wrapping natural language lines
  // (e.g. prose containing "/" for alternatives like "medie/superiori").
  return /[=^]|\\frac|\\sqrt|\\pi|\\omega|\\Delta|\\alpha|\\beta|\\theta|[0-9]\s*[a-zA-Z]|[a-zA-Z]\s*[0-9]|\\sum|\\int/.test(
    line
  );
}

function isLikelyNaturalSentence(line: string): boolean {
  const letters = (line.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
  const spaces = (line.match(/\s/g) || []).length;
  const strongMath = /[=^]|\\frac|\\sqrt|\\sum|\\int|[0-9]\s*[a-zA-Z]|[a-zA-Z]\s*[0-9]/.test(line);
  return letters >= 18 && spaces >= 2 && !strongMath;
}

function ensureLatexFormatting(value: string): string {
  const normalized = normalizeMathSymbols(value);
  if (normalized.includes("\\(") || normalized.includes("$$")) return normalized;
  const lines = normalized.split("\n");
  const fixed = lines.map((raw) => {
    const line = raw.trim();
    if (!line) return raw;
    if (isLikelyNaturalSentence(line)) return raw;
    if (!looksLikeMathLine(line)) return raw;
    if (line.startsWith("\\(") || line.startsWith("$$")) return raw;
    return `\\(${line}\\)`;
  });
  return fixed.join("\n");
}

function ensureQuestionFront(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/[?؟]\s*$/.test(trimmed)) return trimmed;
  return `${trimmed.replace(/[.!]\s*$/, "")}?`;
}

function ensureAnswerBack(value: string): string {
  return value.trim();
}

function parseFlashcardsJson(raw: string): {
  flashcards?: Array<{ front?: string; back?: string }>;
} {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : raw;
  try {
    return JSON.parse(jsonStr) as { flashcards?: Array<{ front?: string; back?: string }> };
  } catch {
    const repaired = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    return JSON.parse(repaired) as { flashcards?: Array<{ front?: string; back?: string }> };
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY non configurata" }, { status: 500 });

  let body: { content?: string; topic?: string; chatContext?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : undefined;
  const topic = typeof body.topic === "string" ? body.topic.trim() : undefined;
  const chatContext = typeof body.chatContext === "string" ? body.chatContext.trim() : undefined;
  if (!content && !topic && !chatContext) {
    return NextResponse.json({ error: "Fornisci 'content', 'topic' o 'chatContext'" }, { status: 400 });
  }

  const prompt = flashcardPrompt({ content, topic, chatContext });
  if (!prompt) return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Sei un assistente che genera flashcard didattiche. Crea flashcard SOLO su argomenti didattici (studio, concetti, formule, esercizi). Escludi saluti, chiacchiere e contenuti non didattici. Ogni front deve essere una domanda e ogni back deve essere una risposta/spiegazione. Rispondi solo con JSON valido.",
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const parsed = parseFlashcardsJson(raw);
    const flashcards = Array.isArray(parsed.flashcards)
      ? parsed.flashcards
          .filter((c) => c?.front && c?.back)
          .map((c) => ({
            front: ensureQuestionFront(ensureLatexFormatting(String(c.front))),
            back: ensureAnswerBack(ensureLatexFormatting(String(c.back))),
          }))
      : [];

    if (flashcards.length === 0) {
      return NextResponse.json({ error: "Nessuna flashcard generata. Riprova." }, { status: 500 });
    }
    return NextResponse.json({ flashcards });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore generazione flashcard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
