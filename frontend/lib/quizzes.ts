import api from "./api";

export type QuestionType = "MultipleChoice" | "OpenEnded";

export interface Answer { id: string; text: string; isCorrect: boolean; }
export interface Question {
  id: string; text: string; answers: Answer[];
  type: QuestionType; correctTextAnswer: string | null;
}
export interface QuizDetail { id: string; title: string; createdAt: string; questions: Question[]; }
export interface QuizSummary { id: string; title: string; questionCount: number; createdAt: string; folderId: string | null; }
export interface QuizFolder { id: string; name: string; description: string | null; quizCount: number; }

// ── Quizzes ───────────────────────────────────────────────────────────────────

export const getQuizzes = async (search?: string): Promise<QuizSummary[]> => {
  const { data } = await api.get("/api/quizzes", { params: search ? { q: search } : undefined });
  return data.data;
};

export const getQuiz = async (id: string): Promise<QuizDetail> => {
  const { data } = await api.get(`/api/quizzes/${id}`);
  return data.data;
};

export const createQuiz = async (payload: {
  title: string;
  folderId?: string | null;
  questions: {
    text: string; type: QuestionType;
    answers: { text: string; isCorrect: boolean }[];
    correctTextAnswer?: string | null;
  }[];
}): Promise<QuizDetail> => {
  const { data } = await api.post("/api/quizzes", payload);
  return data.data;
};

export const deleteQuiz = async (id: string): Promise<void> => {
  await api.delete(`/api/quizzes/${id}`);
};

// ── Quiz folders ──────────────────────────────────────────────────────────────

export const getQuizFolders = async (): Promise<QuizFolder[]> => {
  const { data } = await api.get("/api/quiz-folders");
  return data.data;
};

export const createQuizFolder = async (name: string, description?: string): Promise<QuizFolder> => {
  const { data } = await api.post("/api/quiz-folders", { name, description });
  return data.data;
};

export const renameQuizFolder = async (id: string, name: string, description?: string): Promise<QuizFolder> => {
  const { data } = await api.put(`/api/quiz-folders/${id}`, { name, description });
  return data.data;
};

export const deleteQuizFolder = async (id: string): Promise<void> => {
  await api.delete(`/api/quiz-folders/${id}`);
};
