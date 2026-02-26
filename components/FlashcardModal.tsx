"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageWithMath } from "@/components/MessageWithMath";
import type { Flashcard } from "@/hooks/useFlashcards";

type FlashcardModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  currentCard: Flashcard | null;
  completedCount: number;
  totalCount: number;
  finished: boolean;
  onMarkCorrect: () => void;
  onMarkWrong: () => void;
  onRestart: () => void;
};

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
      <div
        className="h-full rounded-full bg-mentor-orange transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function FlashcardModal({
  open,
  onClose,
  title = "Studia flashcard",
  currentCard,
  completedCount,
  totalCount,
  finished,
  onMarkCorrect,
  onMarkWrong,
  onRestart,
}: FlashcardModalProps) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!open) {
      setFlipped(false);
      return;
    }
    setFlipped(false);
  }, [open, currentCard?.id]);

  const completionProgress = useMemo(() => {
    if (!totalCount) return 0;
    return (completedCount / totalCount) * 100;
  }, [completedCount, totalCount]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
      <div className="flex h-[94vh] w-[96vw] max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft-md">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1A1A1A]">{title}</p>
            <p className="mt-1 text-xs text-[#6B7280]">
              {completedCount}/{totalCount} completate
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Chiudi studio flashcard"
            className="text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-5 pt-4">
          <Progress value={completionProgress} />
        </div>

        <div className="flex flex-1 flex-col p-5">
          {!finished && currentCard ? (
            <>
              <div className="mb-3 text-xs text-[#6B7280]">Obiettivo: 3 corrette per card</div>
              <button
                type="button"
                onClick={() => setFlipped((v) => !v)}
                className="group relative flex min-h-[320px] w-full flex-1 cursor-pointer items-stretch [perspective:1200px]"
              >
                <div
                  className={`relative h-full w-full rounded-2xl border border-[#E5E7EB] transition-transform duration-500 [transform-style:preserve-3d] ${
                    flipped ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  <div className="absolute inset-0 flex h-full w-full flex-col rounded-2xl bg-white p-6 [backface-visibility:hidden]">
                    <p className="mb-4 text-xs font-medium text-mentor-orange">FRONTE</p>
                    <div className="text-left text-[18px] text-[#111827]">
                      <MessageWithMath content={currentCard.front} />
                    </div>
                    <p className="mt-auto text-xs text-[#9CA3AF]">Tocca per vedere la risposta</p>
                  </div>
                  <div className="absolute inset-0 flex h-full w-full [transform:rotateY(180deg)] flex-col rounded-2xl bg-[#FFF9F5] p-6 [backface-visibility:hidden]">
                    <p className="mb-4 text-xs font-medium text-mentor-orange">RETRO</p>
                    <div className="text-left text-[16px] leading-relaxed text-[#111827]">
                      <MessageWithMath content={currentCard.back} />
                    </div>
                    <p className="mt-auto text-xs text-[#9CA3AF]">Segna il tuo risultato</p>
                  </div>
                </div>
              </button>

              <div className="mt-5 flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                  onClick={onMarkWrong}
                >
                  Sbagliata
                </Button>
                <Button
                  type="button"
                  className="bg-mentor-orange text-white hover:bg-mentor-orange/90"
                  onClick={onMarkCorrect}
                >
                  Corretta
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
              <p className="text-2xl font-semibold text-[#111827]">Set completato 🎉</p>
              <p className="mt-2 max-w-md text-sm text-[#6B7280]">
                Tutte le flashcard hanno raggiunto 3 risposte corrette. Ottima memoria a lungo termine.
              </p>
              <div className="mt-6 flex gap-3">
                <Button type="button" variant="outline" className="gap-2" onClick={onRestart}>
                  <RotateCcw className="h-4 w-4" />
                  Riparti
                </Button>
                <Button
                  type="button"
                  className="bg-mentor-orange text-white hover:bg-mentor-orange/90"
                  onClick={onClose}
                >
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
