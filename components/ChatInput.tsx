"use client";

import { useRef } from "react";
import { Paperclip, Pencil, Layers, Send, X } from "lucide-react";
import { motion } from "framer-motion";

type ChatInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  onAttach?: (files: FileList | null) => void;
  onOpenCanvas?: () => void;
  onGenerateFlashcards?: () => void;
  onCancelGenerateFlashcards?: () => void;
  hasChatContent?: boolean;
  flashcardsLoading?: boolean;
  onOpenFlashcards?: () => void;
  hasFlashcards?: boolean;
  flashcardStudyLabel?: string;
  disabled?: boolean;
  placeholder?: string;
  attachmentLabel?: string;
  onClearAttachment?: () => void;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  onOpenCanvas,
  onGenerateFlashcards,
  onCancelGenerateFlashcards,
  hasChatContent = false,
  flashcardsLoading = false,
  onOpenFlashcards,
  hasFlashcards = false,
  flashcardStudyLabel = "Studia flashcard",
  disabled = false,
  placeholder = "Scrivi un messaggio o carica un file...",
  attachmentLabel,
  onClearAttachment,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() && !attachmentLabel) return;
    onSend(e);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex min-w-0 flex-col gap-2 rounded-3xl border border-white/40 bg-white/70 px-2.5 py-2 shadow-md backdrop-blur-lg md:flex-row md:items-end md:gap-2 md:px-4 md:py-3"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          onAttach?.(e.target.files);
          e.currentTarget.value = "";
        }}
      />
      <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-0.5 md:w-auto md:overflow-visible md:pb-0">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="apple-hover flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#8C8C92] transition hover:bg-[#FFF0E6] hover:text-[#FF6200] md:h-9 md:w-9"
          aria-label="Carica file"
        >
          <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        <button
          type="button"
          onClick={onOpenCanvas}
          className="apple-hover flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#8C8C92] transition hover:bg-[#FFF0E6] hover:text-[#FF6200] md:h-9 md:w-9"
          aria-label="Lavagna"
        >
          <Pencil className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        {hasChatContent && onGenerateFlashcards && (
          <>
            <button
              type="button"
              onClick={onGenerateFlashcards}
              disabled={disabled || flashcardsLoading}
              className="apple-hover flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#FF6200]/40 bg-[#FFF0E6] px-2.5 py-1.5 text-[11px] font-medium text-[#FF6200] transition hover:bg-[#FFE4D2] disabled:opacity-70 md:h-9 md:gap-1.5 md:px-3 md:py-2 md:text-xs"
              aria-label="Genera flashcard"
              title="Genera flashcard dalla chat"
            >
              <Layers className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
              {flashcardsLoading ? "Generazione…" : "Genera"}
            </button>
            {flashcardsLoading && onCancelGenerateFlashcards && (
              <button
                type="button"
                onClick={onCancelGenerateFlashcards}
                className="apple-hover flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#DC2626]/30 bg-[#FEE2E2] px-2.5 py-1.5 text-[11px] font-medium text-[#B91C1C] transition hover:bg-[#FECACA] md:h-9 md:gap-1.5 md:px-3 md:py-2 md:text-xs"
                aria-label="Annulla generazione flashcard"
                title="Annulla generazione flashcard"
              >
                <X className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
                Annulla
              </button>
            )}
          </>
        )}
        {hasFlashcards && onOpenFlashcards && (
          <button
            type="button"
            onClick={onOpenFlashcards}
            className="apple-hover flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#FF6200]/40 bg-[#FFF0E6] px-2.5 text-[11px] font-medium text-[#FF6200] transition hover:bg-[#FFE4D2] md:h-9 md:gap-1.5 md:px-3 md:text-xs"
            aria-label="Inizia allenamento flashcard"
            title={flashcardStudyLabel}
          >
            <Layers className="h-4 w-4 md:h-5 md:w-5" />
            {flashcardStudyLabel}
          </button>
        )}
        {attachmentLabel && (
          <div className="flex h-8 max-w-[130px] shrink-0 items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-2 text-[11px] text-[#374151] md:h-9 md:max-w-[180px] md:px-2.5 md:text-xs">
            <span className="truncate">{attachmentLabel}</span>
            {onClearAttachment && (
              <button
                type="button"
                onClick={onClearAttachment}
                className="rounded-full p-0.5 text-[#6B7280] transition hover:bg-[#E5E7EB] hover:text-[#111827]"
                aria-label="Rimuovi allegato"
              >
                <X className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex w-full min-w-0 items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (value.trim() || attachmentLabel) handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="min-h-[40px] max-h-28 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2 text-[14px] text-[#1F1F1F] placeholder:text-[#9ca3af] focus:outline-none md:min-h-[44px] md:px-2 md:py-2.5 md:text-[15px]"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || (!value.trim() && !attachmentLabel)}
          className="apple-hover flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6200] text-white shadow-sm transition hover:bg-[#E85A00] disabled:opacity-50 disabled:hover:bg-[#FF6200] md:h-10 md:w-10"
          aria-label="Invia"
        >
          <Send className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </motion.form>
  );
}
