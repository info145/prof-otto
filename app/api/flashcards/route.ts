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

const flashcardPrompt = (input: {
  content?: string;
  topic?: string;
  chatContext?: string;
  numPages?: number;
  minCards?: number;
}) => {
  if (input.content) {
    const chatAdd = input.chatContext
      ? `\n\nDiscussione nella chat (usa SOLO i concetti didattici emersi):\n"""\n${input.chatContext.slice(0, 4000)}\n"""`
      : "";
    const pagesHint =
      input.numPages && input.numPages > 1
        ? `Il documento ha ${input.numPages} pagine. Genera circa 10-15 flashcard PER OGNI PAGINA (totale minimo ${Math.min(80, input.numPages * 12)}). `
        : "";
    return `${pagesHint}Genera flashcard didattiche dal materiale caricato (file/PDF) e dalla discussione. Per ogni pagina o sezione significativa estrai 10-15 concetti da memorizzare. Ogni flashcard deve avere:
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
    return `Conversazione studente-mentor. Estrai SOLO i contenuti DIDATTICI (definizioni, concetti, formule, esercizi discussi, argomenti di studio). Genera 10-15 flashcard.

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
    return `Genera 10-15 flashcard didattiche sull'argomento: "${input.topic}".
Le flashcard devono coprire i concetti chiave dell'argomento per uno studente italiano.
Ogni flashcard: front SEMPRE domanda (max 2 righe, con ?), back SEMPRE risposta/spiegazione (2-5 righe).
${LATEX_RULES}

Rispondi SOLO con un JSON valido nel formato: {"flashcards":[{"front":"...","back":"..."},{"front":"...","back":"..."}]}
Niente altro testo prima o dopo il JSON. Usa \\n per a capo nel back se necessario.`;
  }
  return null;
};

const recoveryPrompt = (input: {
  content?: string;
  topic?: string;
  chatContext?: string;
  minCards?: number;
}) => {
  const target = Math.min(30, Math.max(10, input.minCards ?? 12));
  const source = input.content || input.chatContext || input.topic || "";
  return `Genera ESATTAMENTE ${target} flashcard in italiano dal testo seguente.
Regole:
- Rispondi SOLO con JSON valido.
- Formato obbligatorio: {"flashcards":[{"front":"...","back":"..."}]}
- Nessun testo fuori dal JSON.
- Ogni "front" deve essere una domanda con "?".
- Ogni "back" deve contenere una risposta breve e chiara.

Testo:
"""
${source.slice(0, 10000)}
"""
`;
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
    try {
      const repaired = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
      return JSON.parse(repaired) as { flashcards?: Array<{ front?: string; back?: string }> };
    } catch {
      return {};
    }
  }
}

function normalizeFlashcards(cards: Array<{ front?: string; back?: string }>) {
  return cards
    .filter((c) => c?.front && c?.back)
    .map((c) => ({
      front: ensureQuestionFront(ensureLatexFormatting(String(c.front))),
      back: ensureAnswerBack(ensureLatexFormatting(String(c.back))),
    }));
}

function heuristicFlashcardsFromText(
  source: string,
  desiredCount = 12
): Array<{ front: string; back: string }> {
  const lines = source
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 30 && l.length <= 260);

  const unique: string[] = [];
  for (const line of lines) {
    if (!unique.some((u) => u.toLowerCase() === line.toLowerCase())) unique.push(line);
    if (unique.length >= desiredCount) break;
  }

  return unique.map((line) => ({
    front: ensureQuestionFront(`Quale concetto chiave emerge da: "${line.slice(0, 90)}"`),
    back: ensureAnswerBack(line),
  }));
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY non configurata" }, { status: 500 });

  let body: { content?: string; topic?: string; chatContext?: string; minCards?: number; numPages?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : undefined;
  const topic = typeof body.topic === "string" ? body.topic.trim() : undefined;
  const chatContext = typeof body.chatContext === "string" ? body.chatContext.trim() : undefined;
  const minCards = typeof body.minCards === "number" ? Math.min(80, Math.max(10, body.minCards)) : undefined;
  const numPages = typeof body.numPages === "number" ? Math.max(1, body.numPages) : 1;
  if (!content && !topic && !chatContext) {
    return NextResponse.json({ error: "Fornisci 'content', 'topic' o 'chatContext'" }, { status: 400 });
  }

  const prompt = flashcardPrompt({ content, topic, chatContext, numPages, minCards });
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
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const parsed = parseFlashcardsJson(raw);
    let flashcards = Array.isArray(parsed.flashcards) ? normalizeFlashcards(parsed.flashcards) : [];

    // Retry once with a stricter recovery prompt when model output is unusable.
    if (flashcards.length === 0) {
      const recovery = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "Rispondi sempre e solo con un oggetto JSON valido.",
          },
          {
            role: "user",
            content: recoveryPrompt({ content, topic, chatContext, minCards }),
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });
      const recoveryRaw = recovery.choices[0]?.message?.content?.trim() || "";
      const recoveryParsed = parseFlashcardsJson(recoveryRaw);
      flashcards = Array.isArray(recoveryParsed.flashcards)
        ? normalizeFlashcards(recoveryParsed.flashcards)
        : [];
    }

    // Last-resort local fallback: create cards from extracted text lines.
    if (flashcards.length === 0) {
      const source = content || chatContext || "";
      if (source.trim()) {
        flashcards = heuristicFlashcardsFromText(
          source,
          Math.min(20, Math.max(10, minCards ?? (numPages > 1 ? numPages * 10 : 12)))
        );
      }
    }

    if (flashcards.length === 0) {
      return NextResponse.json({ error: "Nessuna flashcard generata. Riprova." }, { status: 500 });
    }
    return NextResponse.json({ flashcards });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const friendly =
      message.includes("Unexpected end of JSON input") || message.includes("JSON")
        ? "Risposta modello non valida o incompleta. Riprova."
        : message || "Errore generazione flashcard";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
