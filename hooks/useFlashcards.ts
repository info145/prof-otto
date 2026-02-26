"use client";

import { useEffect, useMemo, useState } from "react";

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  correctCount: number;
};

export type FlashcardDeck = {
  id: string;
  title: string;
  subject: string;
  cards: Flashcard[];
  createdAt: string;
};

const STORAGE_KEY_V1 = "prof-otto-flashcards-v1";
const STORAGE_KEY = "prof-otto-flashcards-v2";

type StoredV2 = Record<string, FlashcardDeck[]>;

function safeParseV2(raw: string | null): StoredV2 {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredV2;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function migrateFromV1(storageScope: string): FlashcardDeck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, { id: string; title: string; cards: Flashcard[]; createdAt: string }>;
    const old = parsed[storageScope];
    if (!old?.cards?.length) return [];
    return [{
      ...old,
      subject: "Generale",
    }];
  } catch {
    return [];
  }
}

function persist(data: StoredV2) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
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
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [lastCardId, setLastCardId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = safeParseV2(localStorage.getItem(STORAGE_KEY));
    let list = stored[storageScope] ?? [];
    if (!list.length) {
      const migrated = migrateFromV1(storageScope);
      if (migrated.length) {
        list = migrated;
        persist({ ...stored, [storageScope]: list });
      }
    }
    setDecks(list);
    setHydrated(true);
  }, [storageScope]);

  const activeDeck = useMemo(() => decks.find((d) => d.id === activeDeckId) ?? null, [decks, activeDeckId]);
  const activeCards = activeDeck?.cards ?? [];
  const completedCount = activeCards.filter((c) => c.correctCount >= 3).length;
  const totalCount = activeCards.length;
  const finished = totalCount > 0 && completedCount === totalCount;

  const currentCard = useMemo(
    () => (currentCardId ? activeCards.find((c) => c.id === currentCardId) ?? null : null),
    [activeCards, currentCardId]
  );

  const saveDecks = (next: FlashcardDeck[]) => {
    setDecks(next);
    if (typeof window !== "undefined") {
      const stored = safeParseV2(localStorage.getItem(STORAGE_KEY));
      persist({ ...stored, [storageScope]: next });
    }
  };

  const getDeckById = (id: string) => decks.find((d) => d.id === id) ?? null;

  const startSet = (title: string, cards: Array<{ front: string; back: string }>, subject = "Generale") => {
    const valid = cards
      .map((c, i) => ({
        id: `${normalizeId(title)}-${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
        front: String(c.front ?? "").trim(),
        back: String(c.back ?? "").trim(),
        correctCount: 0,
      }))
      .filter((c) => c.front && c.back)
      .slice(0, 80);

    if (valid.length < 3) return false;

    const deck: FlashcardDeck = {
      id: `${normalizeId(title)}-${Date.now().toString(36)}`,
      title,
      subject,
      cards: valid,
      createdAt: new Date().toISOString(),
    };

    const next = [deck, ...decks];
    saveDecks(next);
    setActiveDeckId(deck.id);
    const first = pickNextCard(valid, null);
    setCurrentCardId(first?.id ?? null);
    setLastCardId(first?.id ?? null);
    return true;
  };

  const createDeck = (title: string, subject = "Generale") => {
    const deck: FlashcardDeck = {
      id: `deck-${Date.now().toString(36)}`,
      title,
      subject,
      cards: [],
      createdAt: new Date().toISOString(),
    };
    saveDecks([deck, ...decks]);
    setActiveDeckId(deck.id);
    return deck.id;
  };

  const deleteDeck = (deckId: string) => {
    const next = decks.filter((d) => d.id !== deckId);
    saveDecks(next);
    if (activeDeckId === deckId) {
      setActiveDeckId(null);
      setCurrentCardId(null);
      setLastCardId(null);
    }
  };

  const setActiveDeck = (deckId: string | null) => {
    setActiveDeckId(deckId);
    if (deckId) {
      const deck = getDeckById(deckId);
      const first = deck ? pickNextCard(deck.cards, null) : null;
      setCurrentCardId(first?.id ?? null);
      setLastCardId(first?.id ?? null);
    } else {
      setCurrentCardId(null);
      setLastCardId(null);
    }
  };

  const addCard = (deckId: string, front: string, back: string) => {
    const deck = getDeckById(deckId);
    if (!deck) return;
    const card: Flashcard = {
      id: `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      front: front.trim(),
      back: back.trim(),
      correctCount: 0,
    };
    if (!card.front || !card.back) return;
    const updated = decks.map((d) =>
      d.id === deckId ? { ...d, cards: [...d.cards, card] } : d
    );
    saveDecks(updated);
    if (activeDeckId === deckId) {
      const nextDeck = updated.find((d) => d.id === deckId)!;
      const next = pickNextCard(nextDeck.cards, currentCardId);
      if (!currentCardId && next) {
        setCurrentCardId(next.id);
        setLastCardId(next.id);
      }
    }
  };

  const updateCard = (deckId: string, cardId: string, front: string, back: string) => {
    const f = front.trim();
    const b = back.trim();
    if (!f || !b) return;
    const updated = decks.map((d) => {
      if (d.id !== deckId) return d;
      return {
        ...d,
        cards: d.cards.map((c) =>
          c.id === cardId ? { ...c, front: f, back: b } : c
        ),
      };
    });
    saveDecks(updated);
  };

  const removeCard = (deckId: string, cardId: string) => {
    const updated = decks.map((d) => {
      if (d.id !== deckId) return d;
      return { ...d, cards: d.cards.filter((c) => c.id !== cardId) };
    });
    saveDecks(updated);
    if (activeDeckId === deckId && currentCardId === cardId) {
      const nextDeck = updated.find((d) => d.id === deckId);
      const next = nextDeck ? pickNextCard(nextDeck.cards, cardId) : null;
      setCurrentCardId(next?.id ?? null);
      setLastCardId(next?.id ?? null);
    }
  };

  const updateDeckMeta = (deckId: string, updates: { title?: string; subject?: string }) => {
    const updated = decks.map((d) =>
      d.id === deckId ? { ...d, ...updates } : d
    );
    saveDecks(updated);
  };

  const markAnswer = (correct: boolean) => {
    if (!activeDeck || !currentCardId) return;

    const updatedCards = activeDeck.cards.map((card) =>
      card.id === currentCardId
        ? { ...card, correctCount: correct ? Math.min(3, card.correctCount + 1) : 0 }
        : card
    );
    const updatedDeck = { ...activeDeck, cards: updatedCards };
    const updated = decks.map((d) => (d.id === activeDeckId ? updatedDeck : d));
    saveDecks(updated);

    const next = pickNextCard(updatedCards, currentCardId);
    setLastCardId(currentCardId);
    setCurrentCardId(next?.id ?? null);
  };

  const resetActiveSet = () => {
    if (!activeDeck) return;
    const resetDeck = {
      ...activeDeck,
      cards: activeDeck.cards.map((c) => ({ ...c, correctCount: 0 })),
    };
    const updated = decks.map((d) => (d.id === activeDeckId ? resetDeck : d));
    saveDecks(updated);
    const first = pickNextCard(resetDeck.cards, null);
    setCurrentCardId(first?.id ?? null);
    setLastCardId(first?.id ?? null);
  };

  const clearActiveSet = () => {
    setActiveDeckId(null);
    setCurrentCardId(null);
    setLastCardId(null);
  };

  const decksBySubject = useMemo(() => {
    const bySubject: Record<string, FlashcardDeck[]> = {};
    for (const d of decks) {
      const s = d.subject || "Generale";
      if (!bySubject[s]) bySubject[s] = [];
      bySubject[s].push(d);
    }
    return bySubject;
  }, [decks]);

  return {
    hydrated,
    decks,
    decksBySubject,
    activeDeckId: activeDeck?.id ?? null,
    activeSetTitle: activeDeck?.title ?? "",
    activeDeck,
    cards: activeCards,
    currentCard,
    completedCount,
    totalCount,
    finished,
    hasCards: activeCards.length > 0,
    startSet,
    createDeck,
    deleteDeck,
    setActiveDeck,
    addCard,
    updateCard,
    removeCard,
    updateDeckMeta,
    markAnswer,
    resetActiveSet,
    clearActiveSet,
  };
}
