"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
};

export function ChatSidebar({
  sessions,
  currentId,
  onSelect,
  onNewChat,
  onRenameSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-[#EDEDED] bg-white/92 p-4 backdrop-blur-md lg:block">
      <Button onClick={onNewChat} className="apple-hover mb-4 h-11 w-full rounded-full bg-[#FF6200] text-white">
        Nuova chat
      </Button>
      <div className="space-y-2">
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
                  onClick={() => onSelect(s.id)}
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
    </aside>
  );
}
