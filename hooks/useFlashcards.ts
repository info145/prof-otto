"use client";

import { useEffect, useMemo, useState } from "react";

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  correctCount: number;
};

type FlashcardSet = {
  id: string;
  title: string;
  cards: Flashcard[];
  createdAt: string;
};

const STORAGE_KEY = "prof-otto-flashcards-v1";

type StoredFlashcards = Record<string, FlashcardSet>;

function safeParse(raw: string | null): StoredFlashcards {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredFlashcards;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persist(data: StoredFlashcards) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

function normalizeId(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 40) || "set";
}

function randomItem<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function pickNextCard(cards: Flashcard[], lastCardId: string | null): Flashcard | null {
  const pending = cards.filter((c) => c.correctCount < 3);
  if (!pending.length) return null;

  const urgent = pending.filter((c) => c.correctCount === 0);
  const pool = urgent.length ? urgent : pending;
  const noRepeat = pool.filter((c) => c.id !== lastCardId);
  return randomItem(noRepeat.length ? noRepeat : pool);
}

export function useFlashcards(userId?: string) {
  const storageScope = userId || "guest";
  const [sets, setSets] = useState<Record<string, FlashcardSet>>({});
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
    const scoped = parsed[storageScope]?.cards ? { [storageScope]: parsed[storageScope] } : {};
    setSets(scoped);
    setHydrated(true);
  }, [storageScope]);

  const activeSet = useMemo(() => sets[storageScope] ?? null, [sets, storageScope]);
  const activeCards = activeSet?.cards ?? [];
  const completedCount = activeCards.filter((c) => c.correctCount >= 3).length;
  const totalCount = activeCards.length;
  const finished = totalCount > 0 && completedCount === totalCount;

  const currentCard = useMemo(() => {
    if (!currentCardId) return null;
    return activeCards.find((c) => c.id === currentCardId) ?? null;
  }, [activeCards, currentCardId]);

  const saveScopedSet = (nextSet: FlashcardSet | null) => {
    setSets((prevScoped) => {
      const nextScoped = nextSet ? { ...prevScoped, [storageScope]: nextSet } : { ...prevScoped };
      if (!nextSet) delete nextScoped[storageScope];

      if (typeof window !== "undefined") {
        const existing = safeParse(localStorage.getItem(STORAGE_KEY));
        const merged = { ...existing };
        if (nextSet) merged[storageScope] = nextSet;
        else delete merged[storageScope];
        persist(merged);
      }
      return nextScoped;
    });
  };

  const startSet = (title: string, cards: Array<{ front: string; back: string }>) => {
    const valid = cards
      .map((c, i) => ({
        id: `${normalizeId(title)}-${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
        front: String(c.front ?? "").trim(),
        back: String(c.back ?? "").trim(),
        correctCount: 0,
      }))
      .filter((c) => c.front && c.back)
      .slice(0, 10);

    if (valid.length < 5) return false;

    const setId = `${normalizeId(title)}-${Date.now().toString(36)}`;
    const nextSet: FlashcardSet = {
      id: setId,
      title,
      cards: valid,
      createdAt: new Date().toISOString(),
    };

    saveScopedSet(nextSet);
    setActiveSetId(setId);
    const first = pickNextCard(valid, null);
    setCurrentCardId(first?.id ?? null);
    setLastCardId(first?.id ?? null);
    return true;
  };

  const markAnswer = (correct: boolean) => {
    if (!activeSet || !currentCardId) return;

    const updatedCards = activeSet.cards.map((card) => {
      if (card.id !== currentCardId) return card;
      return {
        ...card,
        correctCount: correct ? Math.min(3, card.correctCount + 1) : 0,
      };
    });

    const updatedSet = { ...activeSet, cards: updatedCards };
    saveScopedSet(updatedSet);

    const next = pickNextCard(updatedCards, currentCardId);
    setLastCardId(currentCardId);
    setCurrentCardId(next?.id ?? null);
  };

  const resetActiveSet = () => {
    if (!activeSet) return;
    const resetSet: FlashcardSet = {
      ...activeSet,
      cards: activeSet.cards.map((card) => ({ ...card, correctCount: 0 })),
    };
    saveScopedSet(resetSet);
    const first = pickNextCard(resetSet.cards, null);
    setCurrentCardId(first?.id ?? null);
    setLastCardId(first?.id ?? null);
  };

  const clearActiveSet = () => {
    saveScopedSet(null);
    setActiveSetId(null);
    setCurrentCardId(null);
    setLastCardId(null);
  };

  return {
    hydrated,
    activeSetId: activeSetId ?? activeSet?.id ?? null,
    activeSetTitle: activeSet?.title ?? "",
    cards: activeCards,
    currentCard,
    completedCount,
    totalCount,
    finished,
    hasCards: activeCards.length > 0,
    startSet,
    markAnswer,
    resetActiveSet,
    clearActiveSet,
  };
}
