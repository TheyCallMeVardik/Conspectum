import api from "./api";

export interface NoteSummary {
  id: string;
  title: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDetail extends NoteSummary {
  contentJson: object;
}

export async function getNotes(): Promise<NoteSummary[]> {
  const { data } = await api.get("/api/notes");
  return data.data;
}

export async function getNote(id: string): Promise<NoteDetail> {
  const { data } = await api.get(`/api/notes/${id}`);
  return data.data;
}

export async function createNote(title: string, contentJson: object, folderId?: string | null): Promise<NoteDetail> {
  const { data } = await api.post("/api/notes", { title, contentJson, folderId: folderId ?? null });
  return data.data;
}

export async function updateNote(id: string, title: string, contentJson: object, folderId?: string | null): Promise<NoteDetail> {
  const { data } = await api.put(`/api/notes/${id}`, { title, contentJson, folderId: folderId ?? null });
  return data.data;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/api/notes/${id}`);
}

export async function searchNotes(q: string): Promise<NoteSummary[]> {
  const { data } = await api.get("/api/notes/search", { params: { q } });
  return data.data;
}
