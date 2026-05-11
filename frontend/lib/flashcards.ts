import api from "./api";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: string;
  createdAt: string;
  deckId: string | null;
}

export interface ReviewSession {
  dueCount: number;
  dueCards: Flashcard[];
}

export interface Deck {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  createdAt: string;
}

// ── Flashcards ────────────────────────────────────────────────────────────────

export const getFlashcards = async (deckId?: string): Promise<Flashcard[]> => {
  const params = deckId ? `?deckId=${deckId}` : "";
  const { data } = await api.get(`/api/flashcards${params}`);
  return data.data;
};

export const getDueCards = async (deckId?: string): Promise<ReviewSession> => {
  const params = deckId ? `?deckId=${deckId}` : "";
  const { data } = await api.get(`/api/flashcards/due${params}`);
  return data.data;
};

export const createFlashcard = async (
  front: string,
  back: string,
  deckId?: string
): Promise<Flashcard> => {
  const { data } = await api.post("/api/flashcards", {
    front,
    back,
    deckId: deckId ?? null,
  });
  return data.data;
};

export const deleteFlashcard = async (id: string): Promise<void> => {
  await api.delete(`/api/flashcards/${id}`);
};

export const reviewFlashcard = async (id: string, quality: number): Promise<Flashcard> => {
  const { data } = await api.post(`/api/flashcards/${id}/review`, { quality });
  return data.data;
};

// ── Decks ─────────────────────────────────────────────────────────────────────

export const getDecks = async (): Promise<Deck[]> => {
  const { data } = await api.get("/api/decks");
  return data.data;
};

export const createDeck = async (name: string, description?: string): Promise<Deck> => {
  const { data } = await api.post("/api/decks", { name, description: description ?? null });
  return data.data;
};

export const updateDeck = async (id: string, name: string, description?: string): Promise<Deck> => {
  const { data } = await api.put(`/api/decks/${id}`, { name, description: description ?? null });
  return data.data;
};

export const deleteDeck = async (id: string): Promise<void> => {
  await api.delete(`/api/decks/${id}`);
};
