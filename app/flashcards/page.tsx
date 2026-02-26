"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Edit3, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import {
  useFlashcards,
  type Flashcard,
  type FlashcardDeck,
} from "@/hooks/useFlashcards";
import { FlashcardModal } from "@/components/FlashcardModal";
import { MessageWithMath } from "@/components/MessageWithMath";

const DEFAULT_SUBJECTS = [
  "Italiano",
  "Latino",
  "Greco",
  "Storia",
  "Filosofia",
  "Inglese",
  "Matematica",
  "Fisica",
  "Chimica",
  "Biologia",
  "Scienze della Terra",
  "Storia dell'arte",
  "Disegno tecnico",
  "Informatica",
  "Educazione civica",
  "Scienze motorie",
  "Religione",
  "Generale",
];

export default function FlashcardsPage() {
  const { user } = useProfile();
  const {
    hydrated,
    decks,
    decksBySubject,
    activeDeckId,
    activeDeck,
    currentCard,
    completedCount,
    totalCount,
    finished,
    hasCards,
    setActiveDeck,
    createDeck,
    deleteDeck,
    addCard,
    updateCard,
    removeCard,
    updateDeckMeta,
    markAnswer,
    resetActiveSet,
    clearActiveSet,
  } = useFlashcards(user?.id);

  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckSubject, setNewDeckSubject] = useState("Generale");
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardFront, setEditCardFront] = useState("");
  const [editCardBack, setEditCardBack] = useState("");

  const handleStudy = (deck: FlashcardDeck) => {
    setActiveDeck(deck.id);
    setStudyModalOpen(true);
  };

  const handleCloseStudy = () => {
    setStudyModalOpen(false);
  };

  const handleCreateDeck = () => {
    const title = newDeckTitle.trim() || "Nuovo mazzo";
    const id = createDeck(title, newDeckSubject);
    setNewDeckTitle("");
    setNewDeckSubject("Generale");
    setShowNewDeckForm(false);
    setEditingDeckId(id);
  };

  const handleAddCard = () => {
    if (!editingDeckId || !newCardFront.trim() || !newCardBack.trim()) return;
    addCard(editingDeckId, newCardFront, newCardBack);
    setNewCardFront("");
    setNewCardBack("");
  };

  const startEditCard = (card: Flashcard) => {
    setEditingCardId(card.id);
    setEditCardFront(card.front);
    setEditCardBack(card.back);
  };

  const saveEditCard = () => {
    if (!editingDeckId || !editingCardId) return;
    updateCard(editingDeckId, editingCardId, editCardFront, editCardBack);
    setEditingCardId(null);
    setEditCardFront("");
    setEditCardBack("");
  };

  const cancelEditCard = () => {
    setEditingCardId(null);
  };

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#6b7280]">Caricamento…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-[#EDEDED] px-4 py-4 md:px-6">
        <Link
          href="/chat"
          className="flex items-center gap-2 text-sm font-medium text-[#1F1F1F] hover:text-[#FF6200]"
        >
          <ArrowLeft className="h-4 w-4" />
          Chat
        </Link>
        <h1 className="text-lg font-semibold text-[#1F1F1F]">Le mie flashcards</h1>
        <div className="w-20" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        {showNewDeckForm ? (
          <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
            <p className="mb-3 text-sm font-medium text-[#1F1F1F]">Nuove flashcards</p>
            <input
              type="text"
              value={newDeckTitle}
              onChange={(e) => setNewDeckTitle(e.target.value)}
              placeholder="Titolo raccolta"
              className="mb-3 w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
            />
            <select
              value={newDeckSubject}
              onChange={(e) => setNewDeckSubject(e.target.value)}
              className="mb-3 w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
            >
              {DEFAULT_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateDeck}>
                Crea
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewDeckForm(false)}>
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="mb-6 gap-2"
            onClick={() => setShowNewDeckForm(true)}
          >
            <Plus className="h-4 w-4" />
            Nuove flashcards
          </Button>
        )}

        {editingDeckId ? (
          <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4">
            {decks.find((d) => d.id === editingDeckId) && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={decks.find((d) => d.id === editingDeckId)?.title ?? ""}
                    onChange={(e) => updateDeckMeta(editingDeckId, { title: e.target.value })}
                    className="flex-1 rounded-lg border border-[#E5E7EB] px-2 py-1.5 font-medium"
                  />
                  <select
                    value={decks.find((d) => d.id === editingDeckId)?.subject ?? "Generale"}
                    onChange={(e) => updateDeckMeta(editingDeckId, { subject: e.target.value })}
                    className="rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
                  >
                    {DEFAULT_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDeckId(null)}>
                    Chiudi
                  </Button>
                </div>
              </div>
            )}

            <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3">
              <p className="mb-2 text-xs font-medium text-[#6B7280]">Aggiungi carta</p>
              <input
                type="text"
                value={newCardFront}
                onChange={(e) => setNewCardFront(e.target.value)}
                placeholder="Domanda (fronte)"
                className="mb-2 w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                value={newCardBack}
                onChange={(e) => setNewCardBack(e.target.value)}
                placeholder="Risposta (retro)"
                className="mb-2 w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm"
              />
              <Button size="sm" onClick={handleAddCard} disabled={!newCardFront.trim() || !newCardBack.trim()}>
                <Plus className="mr-1 h-3 w-3" />
                Aggiungi
              </Button>
            </div>

            <div className="space-y-2">
              {(decks.find((d) => d.id === editingDeckId)?.cards ?? []).map((card) => (
                <div
                  key={card.id}
                  className="flex items-start gap-2 rounded-xl border border-[#E5E7EB] p-3"
                >
                  {editingCardId === card.id ? (
                    <>
                      <div className="min-w-0 flex-1">
                        <input
                          value={editCardFront}
                          onChange={(e) => setEditCardFront(e.target.value)}
                          className="mb-1 w-full rounded border px-2 py-1 text-sm"
                          placeholder="Fronte"
                        />
                        <input
                          value={editCardBack}
                          onChange={(e) => setEditCardBack(e.target.value)}
                          className="w-full rounded border px-2 py-1 text-sm"
                          placeholder="Retro"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={saveEditCard}>
                          Salva
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditCard}>
                          Annulla
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#1F1F1F]">
                          <MessageWithMath content={card.front} />
                        </p>
                        <p className="mt-0.5 text-xs text-[#6B7280]">
                          <MessageWithMath content={card.back} />
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEditCard(card)}
                          className="rounded p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#FF6200]"
                          aria-label="Modifica"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCard(editingDeckId, card.id)}
                          className="rounded p-1 text-[#6B7280] hover:bg-red-50 hover:text-red-600"
                          aria-label="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-6">
          {Object.entries(decksBySubject).map(([subject, subjectDecks]) => (
            <div key={subject}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
                {subject}
              </h2>
              <div className="space-y-2">
                {subjectDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-[#1F1F1F]">{deck.title}</p>
                      <p className="text-xs text-[#6B7280]">{deck.cards.length} carte</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDeckId(deck.id);
                          setEditingCardId(null);
                        }}
                        disabled={editingDeckId === deck.id}
                      >
                        <Edit3 className="mr-1 h-4 w-4" />
                        Modifica
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStudy(deck)}
                        disabled={deck.cards.length < 3}
                      >
                        <BookOpen className="mr-1 h-4 w-4" />
                        Studia
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Eliminare questo mazzo?")) deleteDeck(deck.id);
                        }}
                        className="rounded p-2 text-[#6B7280] hover:bg-red-50 hover:text-red-600"
                        aria-label="Elimina mazzo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {decks.length === 0 && !showNewDeckForm && (
          <p className="py-8 text-center text-sm text-[#6B7280]">
            Nessuna flashcard ancora. Crea una raccolta o genera flashcard dalla chat.
          </p>
        )}
      </div>

      <FlashcardModal
        open={studyModalOpen}
        onClose={handleCloseStudy}
        title={activeDeck ? `Flashcard: ${activeDeck.title}` : "Studia flashcard"}
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
