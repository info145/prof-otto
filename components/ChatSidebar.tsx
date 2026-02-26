"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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
      <Button onClick={handleNewChat} className="apple-hover mb-4 mt-2 h-11 w-full shrink-0 rounded-full bg-[#FF6200] text-white lg:mt-0">
        Nuova chat
      </Button>
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
