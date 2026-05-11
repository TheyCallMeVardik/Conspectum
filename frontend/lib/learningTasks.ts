import api from "./api";

export type TaskStatus = "Queued" | "InProgress" | "Done";
export type MaterialType = "Note" | "Deck" | "Quiz";

export interface LearningTask {
  id: string;
  title: string;
  descriptionJson: object | null;
  status: TaskStatus;
  deadline: string | null;
  materialType: MaterialType | null;
  materialId: string | null;
  materialTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertTaskPayload {
  title: string;
  descriptionJson?: object | null;
  status: TaskStatus;
  deadline?: string | null;
  materialType?: MaterialType | null;
  materialId?: string | null;
  materialTitle?: string | null;
}

export async function getTasks(): Promise<LearningTask[]> {
  const { data } = await api.get("/api/tasks");
  return data.data;
}

export async function createTask(payload: UpsertTaskPayload): Promise<LearningTask> {
  const { data } = await api.post("/api/tasks", payload);
  return data.data;
}

export async function updateTask(id: string, payload: UpsertTaskPayload): Promise<LearningTask> {
  const { data } = await api.put(`/api/tasks/${id}`, payload);
  return data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  Queued: "В очереди",
  InProgress: "Выполняю",
  Done: "Выполнены",
};

export const STATUS_ORDER: TaskStatus[] = ["Queued", "InProgress", "Done"];
