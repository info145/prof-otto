"use client";

import { useRef } from "react";
import { Paperclip, Pencil, Layers, Send } from "lucide-react";
import { motion } from "framer-motion";

type ChatInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  onAttach?: (files: FileList | null) => void;
  onOpenCanvas?: () => void;
  onGenerateFlashcards?: () => void;
  hasChatContent?: boolean;
  flashcardsLoading?: boolean;
  onOpenFlashcards?: () => void;
  hasFlashcards?: boolean;
  flashcardStudyLabel?: string;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  onOpenCanvas,
  onGenerateFlashcards,
  hasChatContent = false,
  flashcardsLoading = false,
  onOpenFlashcards,
  hasFlashcards = false,
  flashcardStudyLabel = "Studia flashcard",
  disabled = false,
  placeholder = "Scrivi un messaggio o carica un file...",
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(e);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-end gap-2 rounded-3xl border border-white/40 bg-white/70 px-4 py-3 shadow-md backdrop-blur-lg"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => onAttach?.(e.target.files)}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="apple-hover flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[#8C8C92] transition hover:bg-[#FFF0E6] hover:text-[#FF6200]"
        aria-label="Carica file"
      >
        <Paperclip className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onOpenCanvas}
        className="apple-hover flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[#8C8C92] transition hover:bg-[#FFF0E6] hover:text-[#FF6200]"
        aria-label="Lavagna"
      >
        <Pencil className="h-5 w-5" />
      </button>
      {hasChatContent && onGenerateFlashcards && (
        <button
          type="button"
          onClick={onGenerateFlashcards}
          disabled={disabled || flashcardsLoading}
          className="apple-hover flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#FF6200]/40 bg-[#FFF0E6] px-3 py-2 text-xs font-medium text-[#FF6200] transition hover:bg-[#FFE4D2] disabled:opacity-70"
          aria-label="Genera flashcard"
          title="Genera flashcard dalla chat"
        >
          <Layers className="h-4 w-4 shrink-0" />
          {flashcardsLoading ? "Generazione…" : "Genera flashcard"}
        </button>
      )}
      {hasFlashcards && onOpenFlashcards && (
        <button
          type="button"
          onClick={onOpenFlashcards}
          className="apple-hover flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#FF6200]/40 bg-[#FFF0E6] px-3 text-xs font-medium text-[#FF6200] transition hover:bg-[#FFE4D2]"
          aria-label="Inizia allenamento flashcard"
          title={flashcardStudyLabel}
        >
          <Layers className="h-5 w-5" />
          {flashcardStudyLabel}
        </button>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) handleSubmit(e as unknown as React.FormEvent);
          }
        }}
        rows={1}
        placeholder={placeholder}
        className="min-h-[44px] max-h-28 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] text-[#1F1F1F] placeholder:text-[#9ca3af] focus:outline-none"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="apple-hover flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6200] text-white shadow-sm transition hover:bg-[#E85A00] disabled:opacity-50 disabled:hover:bg-[#FF6200]"
        aria-label="Invia"
      >
        <Send className="h-5 w-5" />
      </button>
    </motion.form>
  );
}
