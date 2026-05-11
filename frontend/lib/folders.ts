import api from "./api";

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  noteCount: number;
}

export async function getFolders(): Promise<Folder[]> {
  const { data } = await api.get("/api/folders");
  return data.data;
}

export async function createFolder(name: string, description?: string): Promise<Folder> {
  const { data } = await api.post("/api/folders", { name, description: description || null });
  return data.data;
}

export async function renameFolder(id: string, name: string, description?: string): Promise<Folder> {
  const { data } = await api.patch(`/api/folders/${id}`, { name, description: description || null });
  return data.data;
}

export async function deleteFolder(id: string): Promise<void> {
  await api.delete(`/api/folders/${id}`);
}
