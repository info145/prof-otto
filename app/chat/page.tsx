"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatSidebar, type ChatSession } from "@/components/ChatSidebar";
import { ChatBubble } from "@/components/ChatBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatInput } from "@/components/ChatInput";
import { CanvasDrawModal } from "@/components/CanvasDrawModal";
import { FlashcardModal } from "@/components/FlashcardModal";
import { useProfile } from "@/hooks/useProfile";
import { useFlashcards } from "@/hooks/useFlashcards";
import type { GraphSpec } from "@/lib/graph-spec";
import { sanitizeGraphSpec } from "@/lib/graph-spec";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  graphSpec?: GraphSpec;
};

const STORAGE_KEY = "prof-otto-chat";

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Ciao! Sono Prof Otto, il tuo mentor AI. Puoi scrivermi, caricare file o disegnare qualcosa sulla lavagna. Come posso aiutarti?",
  },
];

type StoredState = {
  sessions: ChatSession[];
  currentSessionId: string;
  messagesBySessionId: Record<string, Message[]>;
  pdfTextBySessionId?: Record<string, string>;
};

function normalizeStoredMessages(input: unknown): Message[] {
  if (!Array.isArray(input)) return [...initialMessages];
  const normalized = input
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const item = raw as Record<string, unknown>;
      const role = item.role === "user" ? "user" : item.role === "assistant" ? "assistant" : null;
      if (!role) return null;
      const content = typeof item.content === "string" ? item.content : "";
      const imageUrl = typeof item.imageUrl === "string" ? item.imageUrl : undefined;
      const graphSpec = sanitizeGraphSpec(item.graphSpec);
      if (!content && !imageUrl && !graphSpec) return null;
      return {
        id: typeof item.id === "string" && item.id ? item.id : generateId(),
        role,
        content: content || (graphSpec ? "Ti ho preparato un grafico utile per questa spiegazione." : ""),
        imageUrl,
        graphSpec: graphSpec ?? undefined,
      } satisfies Message;
    })
    .filter((m): m is Message => m !== null);

  return normalized.length > 0 ? normalized : [...initialMessages];
}

function getDefaultState(): StoredState {
  return {
    sessions: [{ id: "default", title: "Nuova chat", updatedAt: new Date() }],
    currentSessionId: "default",
    messagesBySessionId: { default: [...initialMessages] },
    pdfTextBySessionId: {},
  };
}

function loadState(): StoredState {
  if (typeof window === "undefined") return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as {
      sessions: ChatSession[];
      currentSessionId: string;
      messagesBySessionId: Record<string, Message[]>;
      pdfTextBySessionId?: Record<string, string>;
    };
    const sessions: ChatSession[] = (parsed.sessions || []).map((s) => ({
      ...s,
      updatedAt: new Date(s.updatedAt),
    }));
    if (sessions.length === 0) return getDefaultState();
    const parsedMessages = parsed.messagesBySessionId || {};
    const messagesBySessionId: Record<string, Message[]> = {};

    for (const session of sessions) {
      messagesBySessionId[session.id] = normalizeStoredMessages(parsedMessages[session.id]);
    }
    if (!messagesBySessionId.default) {
      messagesBySessionId.default = [...initialMessages];
    }

    const safeCurrentId = messagesBySessionId[parsed.currentSessionId]?.length
      ? parsed.currentSessionId
      : sessions[0].id;

    return {
      sessions,
      currentSessionId: safeCurrentId || sessions[0].id,
      messagesBySessionId,
      pdfTextBySessionId: parsed.pdfTextBySessionId || {},
    };
  } catch {
    return getDefaultState();
  }
}

function saveState(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    const toSave = {
      sessions: state.sessions,
      currentSessionId: state.currentSessionId,
      messagesBySessionId: Object.fromEntries(
        Object.entries(state.messagesBySessionId).map(([id, list]) => [
          id,
          list.map(({ id: mid, role, content, imageUrl, graphSpec }) => ({
            id: mid,
            role,
            content,
            imageUrl,
            graphSpec,
          })),
        ])
      ),
      pdfTextBySessionId: state.pdfTextBySessionId || {},
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore quota issues
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function messagesToPayload(
  messages: Message[],
  append?: { role: "user"; content: string; imageUrl?: string }
): Promise<{ role: string; content: string; imageUrl?: string }[]> {
  const list = append ? [...messages, append] : messages;
  const out: { role: string; content: string; imageUrl?: string }[] = [];
  for (const m of list) {
    const base = { role: m.role, content: m.content };
    if (m.imageUrl) {
      const url = m.imageUrl.startsWith("data:") ? m.imageUrl : await blobUrlToDataUrl(m.imageUrl);
      out.push({ ...base, imageUrl: url });
    } else {
      out.push(base);
    }
  }
  return out;
}

type GeneratedFlashcard = { front: string; back: string };

function shouldAutoGenerateFlashcards(text: string): boolean {
  const value = text.toLowerCase();
  return /(flashcard|ripass|studia|studiare|alleniamoci|quiz|testami|interrogami|schede)/.test(value);
}

async function generateFlashcardsFromContext(body: {
  content?: string;
  chatContext?: string;
  numPages?: number;
  minCards?: number;
}, signal?: AbortSignal): Promise<GeneratedFlashcard[]> {
  const res = await fetch("/api/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!contentType.includes("application/json")) {
    throw new Error("Errore nella generazione. Riprova.");
  }
  if (!text.trim()) {
    throw new Error("Risposta vuota dal server. Riprova.");
  }
  let data: {
    error?: string;
    flashcards?: GeneratedFlashcard[];
  };
  try {
    data = JSON.parse(text) as { error?: string; flashcards?: GeneratedFlashcard[] };
  } catch {
    throw new Error("Risposta non valida dal server flashcards. Riprova.");
  }
  if (!res.ok) throw new Error(data.error || "Errore flashcard");
  return data.flashcards ?? [];
}

export default function ChatPage() {
  const router = useRouter();
  const { user, profile, loading: profileLoading } = useProfile();

  useEffect(() => {
    if (profileLoading) return;
    if (user && profile === null) {
      router.replace("/onboarding");
      return;
    }
  }, [profileLoading, user, profile, router]);

  const defaultState = getDefaultState();
  const [sessions, setSessions] = useState<ChatSession[]>(defaultState.sessions);
  const [currentSessionId, setCurrentSessionId] = useState<string>(defaultState.currentSessionId);
  const [messagesBySessionId, setMessagesBySessionId] = useState<Record<string, Message[]>>(
    defaultState.messagesBySessionId
  );
  const [pdfTextBySessionId, setPdfTextBySessionId] = useState<Record<string, string>>(
    defaultState.pdfTextBySessionId ?? {}
  );
  const [pdfPagesBySessionId, setPdfPagesBySessionId] = useState<Record<string, number>>({});
  const [input, setInput] = useState("");
  const [pendingImageAttachment, setPendingImageAttachment] = useState<{
    dataUrl: string;
    name: string;
  } | null>(null);
  const [typing, setTyping] = useState(false);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const flashcardsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  useEffect(() => {
    return () => {
      flashcardsAbortRef.current?.abort();
      flashcardsAbortRef.current = null;
    };
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    hasCards,
    currentCard,
    completedCount,
    totalCount,
    finished,
    startSet,
    markAnswer,
    resetActiveSet,
    activeSetTitle,
    clearActiveSet,
  } = useFlashcards(user?.id);

  const messages =
    messagesBySessionId[currentSessionId] && messagesBySessionId[currentSessionId].length > 0
      ? messagesBySessionId[currentSessionId]
      : initialMessages;

  useEffect(() => {
    const state = loadState();
    setSessions(state.sessions);
    setCurrentSessionId(state.currentSessionId);
    setMessagesBySessionId(state.messagesBySessionId);
    setPdfTextBySessionId(state.pdfTextBySessionId ?? {});
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const healedMessagesBySessionId = Object.fromEntries(
      Object.entries(messagesBySessionId).map(([sid, list]) => [sid, normalizeStoredMessages(list)])
    ) as Record<string, Message[]>;
    saveState({
      sessions,
      currentSessionId,
      messagesBySessionId: healedMessagesBySessionId,
      pdfTextBySessionId,
    });
  }, [hydrated, sessions, currentSessionId, messagesBySessionId, pdfTextBySessionId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const addMessage = useCallback(
    (msg: Omit<Message, "id">) => {
      const safeContent = (msg.content ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\u0000/g, "")
        .replace(/\n{4,}/g, "\n\n\n")
        .trim();
      const newMsg: Message = { ...msg, id: generateId() };
      newMsg.content = safeContent;
      if (newMsg.graphSpec) {
        const safeGraph = sanitizeGraphSpec(newMsg.graphSpec);
        if (!safeGraph) {
          delete newMsg.graphSpec;
        } else {
          newMsg.graphSpec = safeGraph;
        }
      }
      setMessagesBySessionId((prev) => {
        const list = prev[currentSessionId] ?? initialMessages;
        return { ...prev, [currentSessionId]: [...list, newMsg] };
      });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, title: msg.content.slice(0, 30) || "Chat", updatedAt: new Date() } : s
        )
      );
      setTimeout(scrollToBottom, 50);
      return newMsg;
    },
    [currentSessionId, scrollToBottom]
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text && !pendingImageAttachment) return;
    const attachedImageUrl = pendingImageAttachment?.dataUrl;
    const userContent = text || "Immagine allegata";
    setInput("");
    setPendingImageAttachment(null);
    addMessage({ role: "user", content: userContent, imageUrl: attachedImageUrl });
    setTyping(true);

    const wantsFlashcards = text ? shouldAutoGenerateFlashcards(text) : false;

    messagesToPayload(messages, { role: "user", content: userContent, imageUrl: attachedImageUrl })
      .then((payload) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
        })
      )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore di rete");
        return {
          message: (data.message as string) || "",
          graphSpec: sanitizeGraphSpec(data.graphSpec),
        };
      })
      .then(({ message, graphSpec }) => {
        addMessage({ role: "assistant", content: message, graphSpec: graphSpec ?? undefined });
        if (wantsFlashcards) {
          const chatContext = [
            ...messages,
            { id: "tmp-u", role: "user", content: userContent },
            { id: "tmp-a", role: "assistant", content: message },
          ]
            .filter(
              (m) =>
                m.content &&
                !m.content.startsWith("Immagine allegata") &&
                !m.content.startsWith("Disegno dalla lavagna")
            )
            .map((m) => `${m.role === "user" ? "Studente" : "Prof Otto"}: ${m.content}`)
            .join("\n\n");

          generateFlashcardsFromContext({ chatContext: chatContext.slice(0, 8000) })
            .then((cards) => {
              if (!cards?.length) return;
              const started = startSet("Dalla conversazione", cards);
              if (!started) return;
              setFlashcardModalOpen(true);
              addMessage({
                role: "assistant",
                content: "Bene! Ora testiamo con flashcard per fissare il concetto 🧠",
              });
            })
            .catch(() => {
              // evita doppio errore verboso in chat: resta il flusso principale
            });
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "";
        const friendly =
          msg.includes("OPENAI_API_KEY")
            ? "Chiave OpenAI non configurata nel server. Crea .env.local con OPENAI_API_KEY valida e riavvia npm run dev."
            : msg;
        addMessage({
          role: "assistant",
          content: "Mi dispiace, c'è stato un errore. " + friendly,
        });
      })
      .finally(() => setTyping(false));
  };

  const handleCancelFlashcardsGeneration = useCallback(() => {
    flashcardsAbortRef.current?.abort();
    flashcardsAbortRef.current = null;
    setFlashcardsLoading(false);
    addMessage({
      role: "assistant",
      content: "Generazione flashcard annullata, sarà per la prossima volta 🌊",
    });
  }, [addMessage]);

  const handleGenerateFlashcards = useCallback(() => {
    const pdfText = pdfTextBySessionId[currentSessionId];
    const chatContext =
      messages
        .filter(
          (m) =>
            m.content &&
            !m.content.startsWith("Immagine allegata") &&
            !m.content.startsWith("Disegno dalla lavagna")
        )
        .map((m) => `${m.role === "user" ? "Studente" : "Prof Otto"}: ${m.content}`)
        .join("\n\n") || "";

    if (!pdfText && !chatContext.trim()) return;

    flashcardsAbortRef.current?.abort();
    const controller = new AbortController();
    flashcardsAbortRef.current = controller;
    setFlashcardsLoading(true);
    const numPages = pdfPagesBySessionId[currentSessionId] ?? 1;
    const body: { content?: string; chatContext?: string; numPages?: number; minCards?: number } = pdfText
      ? {
          content: pdfText,
          chatContext: chatContext ? chatContext.slice(0, 4000) : undefined,
          numPages,
          minCards: Math.min(80, numPages * 15),
        }
      : { chatContext: chatContext.slice(0, 8000) };

    generateFlashcardsFromContext(body, controller.signal)
      .then((cards) => {
        if (controller.signal.aborted) return;
        if (cards?.length) {
          const sourceTitle = pdfText ? "Dal PDF" : "Dalla conversazione";
          const started = startSet(sourceTitle, cards);
          if (!started) {
            throw new Error("Le flashcard ricevute non sono valide.");
          }
          setFlashcardModalOpen(true);
          addMessage({
            role: "assistant",
            content: "Bene! Ora testiamo con flashcard per fissare il concetto 🧠",
          });
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        addMessage({
          role: "assistant",
          content: "Errore nella generazione delle flashcard. " + (err instanceof Error ? err.message : "Riprova."),
        });
      })
      .finally(() => {
        if (flashcardsAbortRef.current === controller) {
          flashcardsAbortRef.current = null;
        }
        setFlashcardsLoading(false);
      });
  }, [currentSessionId, pdfTextBySessionId, pdfPagesBySessionId, messages, addMessage, startSet]);

  const handleAttach = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPendingImageAttachment({ dataUrl, name: file.name });
      };
      reader.readAsDataURL(file);
    } else if (file.name.toLowerCase().endsWith(".pdf")) {
      addMessage({ role: "user", content: `PDF allegato: ${file.name}` });
      setTyping(true);
      const formData = new FormData();
      formData.append("file", file);
      fetch("/api/parse-pdf", { method: "POST", body: formData })
        .then(async (res) => {
          const contentType = res.headers.get("content-type") || "";
          const raw = await res.text();
          if (!contentType.includes("application/json")) {
            throw new Error("Errore dal server. Riprova o prova con un PDF più piccolo.");
          }
          const data = JSON.parse(raw);
          if (!res.ok) throw new Error(data.error || "Errore lettura PDF");
          return { text: data.text as string, numpages: (data.numpages as number) ?? 1 };
        })
        .then(({ text: pdfText, numpages }) => {
          setPdfTextBySessionId((prev) => ({ ...prev, [currentSessionId]: pdfText }));
          setPdfPagesBySessionId((prev) => ({ ...prev, [currentSessionId]: numpages }));
          const contentWithPdf = `PDF allegato: ${file.name}\n\nContenuto del documento:\n${pdfText.slice(0, 6000)}`;
          return messagesToPayload(messages, {
            role: "user",
            content: contentWithPdf,
          });
        })
        .then((payload) =>
          fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: payload }),
          })
        )
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Errore di rete");
          return {
            message: (data.message as string) || "",
            graphSpec: sanitizeGraphSpec(data.graphSpec),
          };
        })
        .then(({ message, graphSpec }) =>
          addMessage({ role: "assistant", content: message, graphSpec: graphSpec ?? undefined })
        )
        .catch((err) =>
          addMessage({
            role: "assistant",
            content: "Errore nell'elaborazione del PDF. " + (err instanceof Error ? err.message : "Riprova."),
          })
        )
        .finally(() => setTyping(false));
    } else {
      addMessage({
        role: "user",
        content: `File allegato: ${file.name}`,
      });
    }
  };

  const handleSendImage = (dataUrl: string) => {
    addMessage({
      role: "user",
      content: "Disegno dalla lavagna",
      imageUrl: dataUrl,
    });
    setTyping(true);
    messagesToPayload(messages, { role: "user", content: "Disegno dalla lavagna", imageUrl: dataUrl })
      .then((payload) =>
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
        })
      )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore di rete");
        return {
          message: (data.message as string) || "",
          graphSpec: sanitizeGraphSpec(data.graphSpec),
        };
      })
      .then(({ message, graphSpec }) =>
        addMessage({ role: "assistant", content: message, graphSpec: graphSpec ?? undefined })
      )
      .catch((err) =>
        addMessage({
          role: "assistant",
          content: "Errore nell'analisi del disegno. " + (err instanceof Error ? err.message : ""),
        })
      )
      .finally(() => setTyping(false));
  };

  const handleNewChat = () => {
    const id = generateId();
    setSessions((prev) => [{ id, title: "Nuova chat", updatedAt: new Date() }, ...prev]);
    setCurrentSessionId(id);
    setMessagesBySessionId((prev) => ({ ...prev, [id]: [...initialMessages] }));
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const handleRenameSession = useCallback((id: string, newTitle: string) => {
    const t = newTitle.trim() || "Nuova chat";
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: t, updatedAt: new Date() } : s)));
  }, []);

  const handleClearSession = useCallback(
    (id: string) => {
      setMessagesBySessionId((prev) => ({ ...prev, [id]: [...initialMessages] }));
      setPdfTextBySessionId((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (id === currentSessionId) {
        clearActiveSet();
      }
    },
    [clearActiveSet, currentSessionId]
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      const remaining = sessions.filter((s) => s.id !== id);
      const newSessions =
        remaining.length > 0 ? remaining : [{ id: generateId(), title: "Nuova chat", updatedAt: new Date() }];
      const newCurrentId = currentSessionId === id ? newSessions[0].id : currentSessionId;

      setSessions(newSessions);
      setCurrentSessionId(newCurrentId);
      setMessagesBySessionId((prev) => {
        const next = { ...prev };
        delete next[id];
        if (!next[newCurrentId]) {
          next[newCurrentId] = [...initialMessages];
        }
        return next;
      });
      setPdfTextBySessionId((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (id === currentSessionId) {
        clearActiveSet();
      }
    },
    [clearActiveSet, currentSessionId, sessions]
  );

  const handleClearChat = useCallback(() => {
    handleClearSession(currentSessionId);
  }, [currentSessionId, handleClearSession]);

  if (profileLoading || (user && profile === null)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
        <p className="text-sm text-[#6b7280]">Caricamento…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        currentId={currentSessionId}
        onSelect={handleSelectSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-white/70">
        <ChatHeader
          onClearChat={handleClearChat}
          hasMessages={messages.length > 1}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <div className="min-h-0 overflow-y-auto overflow-x-hidden bg-[#FAFAFA]/60 px-4 py-6 md:px-6 md:py-10">
          <div className="mx-auto flex max-w-3xl flex-col gap-7">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isImage={!!msg.imageUrl}
                imageUrl={msg.imageUrl}
                graphSpec={msg.graphSpec}
                showAvatar={msg.role === "assistant"}
              />
            ))}
            {typing && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="border-t border-[#EDEDED] bg-white/85 px-3 py-3 backdrop-blur md:px-6 md:py-4">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="mx-auto max-w-3xl"
          >
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onAttach={handleAttach}
              attachmentLabel={pendingImageAttachment ? `Foto: ${pendingImageAttachment.name}` : undefined}
              onClearAttachment={() => setPendingImageAttachment(null)}
              onOpenCanvas={() => setCanvasOpen(true)}
              onGenerateFlashcards={handleGenerateFlashcards}
              onCancelGenerateFlashcards={handleCancelFlashcardsGeneration}
              hasChatContent={messages.length > 1 || !!pdfTextBySessionId[currentSessionId]}
              flashcardsLoading={flashcardsLoading}
              onOpenFlashcards={() => setFlashcardModalOpen(true)}
              hasFlashcards={hasCards}
              flashcardStudyLabel="Studia flashcard"
              disabled={typing || flashcardsLoading}
              placeholder="Otto tentacoli, una missione: aiutarti 🫧 Da dove partiamo?"
            />
          </motion.div>
        </div>
      </div>
      <CanvasDrawModal open={canvasOpen} onClose={() => setCanvasOpen(false)} onSendImage={handleSendImage} />
      <FlashcardModal
        open={flashcardModalOpen}
        onClose={() => setFlashcardModalOpen(false)}
        title={activeSetTitle ? `Flashcard: ${activeSetTitle}` : "Studia flashcard"}
        currentCard={currentCard}
        completedCount={completedCount}
        totalCount={totalCount}
        finished={finished}
        onMarkCorrect={() => markAnswer(true)}
        onMarkWrong={() => markAnswer(false)}
        onRestart={resetActiveSet}
      />
    </div>
  );
}
