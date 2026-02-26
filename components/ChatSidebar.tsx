"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, X } from "lucide-react";

export type ChatSession = {
  id: string;
  title: string;
  updatedAt: Date;
};

type ChatSidebarProps = {
  sessions: ChatSession[];
  currentId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRenameSession?: (id: string, title: string) => void;
  onDeleteSession?: (id: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const CURIOSITIES: Array<{ subject: string; text: string }> = [
  {
    subject: "Matematica",
    text: "Lo zero come numero è stato accettato in Europa molto tardi: per secoli era visto con sospetto.",
  },
  {
    subject: "Fisica",
    text: "Sulla Luna un martello e una piuma cadono con la stessa accelerazione, perché manca quasi del tutto l'aria.",
  },
  {
    subject: "Latino",
    text: "Il latino ha influenzato tantissime lingue moderne: in italiano moltissime parole hanno radici latine dirette.",
  },
  {
    subject: "Greco",
    text: "Molti termini scientifici vengono dal greco antico: 'bio-', 'geo-', 'chrono-' sono esempi quotidiani.",
  },
  {
    subject: "Storia",
    text: "L'invenzione della stampa a caratteri mobili ha cambiato la velocità con cui le idee circolavano in Europa.",
  },
  {
    subject: "Scienze",
    text: "Il tuo corpo contiene abbastanza carbonio da poter riempire migliaia di mine di matita.",
  },
  {
    subject: "Italiano",
    text: "Molti sonetti italiani usano schemi metrici rigorosi: la forma aiuta anche la memoria del contenuto.",
  },
  {
    subject: "Inglese",
    text: "L'inglese moderno ha preso vocaboli da tantissime lingue, per questo ha sinonimi con sfumature diverse.",
  },
];

export function ChatSidebar({
  sessions,
  currentId,
  onSelect,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  mobileOpen = false,
  onMobileClose,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [curiosityIndex, setCuriosityIndex] = useState(() => Math.floor(Math.random() * CURIOSITIES.length));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCuriosityIndex((prev) => {
        if (CURIOSITIES.length <= 1) return prev;
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * CURIOSITIES.length);
        }
        return next;
      });
    }, 9000);
    return () => window.clearInterval(intervalId);
  }, []);

  const currentCuriosity = CURIOSITIES[curiosityIndex];

  const handleSelect = (id: string) => {
    onSelect(id);
    onMobileClose?.();
  };

  const handleNewChat = () => {
    onNewChat();
    onMobileClose?.();
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <span className="text-sm font-semibold text-[#1F1F1F]">Chat</span>
        <button
          type="button"
          onClick={onMobileClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8E8E93] transition hover:bg-[#FFF0E6] hover:text-[#1F1F1F]"
          aria-label="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <Button onClick={handleNewChat} className="apple-hover mb-3 mt-2 h-11 w-full shrink-0 rounded-full bg-[#FF6200] text-white lg:mt-0">
        Nuova chat
      </Button>
      <Link
        href="/flashcards"
        onClick={onMobileClose}
        className="apple-hover mb-4 flex items-center justify-center gap-2 rounded-full border border-[#EDEDED] px-4 py-2.5 text-sm font-medium text-[#1F1F1F] transition hover:bg-[#FFF0E6] hover:border-[#FF6200]/30"
      >
        <BookOpen className="h-4 w-4" />
        Le mie flashcards
      </Link>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {sessions.map((s) => (
            <Card
              key={s.id}
              className={cn(
                "group border-none bg-transparent p-0 shadow-none",
                s.id === currentId ? "" : ""
              )}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 transition",
                  s.id === currentId ? "bg-[#FFF0E6]" : "hover:bg-[#FFF0E6]"
                )}
              >
                {editingId === s.id ? (
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => {
                      onRenameSession?.(s.id, draft);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onRenameSession?.(s.id, draft);
                        setEditingId(null);
                      }
                    }}
                    className="w-full rounded-xl border border-[#EDEDED] bg-white px-2 py-1 text-sm"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    className="flex-1 truncate text-left"
                    onClick={() => handleSelect(s.id)}
                    onDoubleClick={() => {
                      setEditingId(s.id);
                      setDraft(s.title);
                    }}
                  >
                    <p className="truncate text-sm font-medium text-[#1F1F1F]">{s.title}</p>
                    <p className="mt-0.5 text-[11px] text-[#8E8E93]">
                      {new Date(s.updatedAt).toLocaleDateString("it-IT")}
                    </p>
                  </button>
                )}
                {onDeleteSession && (
                  <button
                    type="button"
                    onClick={() => onDeleteSession(s.id)}
                    className="opacity-0 transition group-hover:opacity-100"
                    aria-label="Elimina chat"
                    title="Elimina chat"
                  >
                    🗑️
                  </button>
                )}
              </motion.div>
            </Card>
          ))}
        </div>
        <motion.div
          key={curiosityIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="shrink-0 rounded-2xl border border-[#FFE2CF] bg-[#FFF7F1] p-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#FF6200]">Curiosita del momento</p>
          <p className="mt-1 text-xs font-medium text-[#1F1F1F]">{currentCuriosity.subject}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">{currentCuriosity.text}</p>
        </motion.div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: always visible sidebar */}
      <aside
        className={cn(
          "flex h-full w-[280px] shrink-0 flex-col border-r border-[#EDEDED] bg-white/92 p-4 backdrop-blur-md",
          "hidden lg:flex"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile: overlay when open */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/25 lg:hidden"
            onClick={onMobileClose}
            aria-hidden
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-[#EDEDED] bg-white/98 p-4 shadow-xl backdrop-blur-md",
              "lg:hidden"
            )}
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
