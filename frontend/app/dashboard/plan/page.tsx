"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Button, TextField, IconButton, Chip, Card,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  Select, MenuItem, FormControl, InputLabel, ToggleButtonGroup, ToggleButton,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LinkIcon from "@mui/icons-material/Link";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  getTasks, createTask, updateTask, deleteTask,
  LearningTask, TaskStatus, MaterialType,
  STATUS_LABELS, STATUS_ORDER, UpsertTaskPayload,
} from "@/lib/learningTasks";
import { getNotes } from "@/lib/notes";
import { getDecks, Deck } from "@/lib/flashcards";
import { getQuizzes } from "@/lib/quizzes";
import TiptapEditor from "@/components/TiptapEditor";

function getMaterialHref(type: MaterialType, id: string | null): string {
  if (type === "Note" && id) return `/dashboard/notes/${id}`;
  if (type === "Deck" && id) return `/dashboard/flashcards?deck=${id}`;
  if (type === "Quiz" && id) return `/dashboard/quizzes?quiz=${id}`;
  return "#";
}

const STATUS_COLORS: Record<TaskStatus, string> = { Queued: "#6B6B6B", InProgress: "#2563EB", Done: "#16A34A" };

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PlanPage() {
  const queryClient = useQueryClient();
  const [modalTask, setModalTask] = useState<LearningTask | null | "new">(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("Queued");
  const [activeTask, setActiveTask] = useState<LearningTask | null>(null);

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: getTasks });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ task, status }: { task: LearningTask; status: TaskStatus }) =>
      updateTask(task.id, { title: task.title, descriptionJson: task.descriptionJson, status, deadline: task.deadline, materialType: task.materialType, materialId: task.materialId, materialTitle: task.materialTitle }),
    onMutate: async ({ task, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const prev = queryClient.getQueryData<LearningTask[]>(["tasks"]);
      queryClient.setQueryData<LearningTask[]>(["tasks"], old => old?.map(t => t.id === task.id ? { ...t, status } : t) ?? []);
      return { prev };
    },
    onError: (_e, _v, ctx) => { queryClient.setQueryData(["tasks"], ctx?.prev); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragStart(e: DragStartEvent) {
    const task = (tasks as LearningTask[]).find(t => t.id === e.active.id);
    if (task) setActiveTask(task);
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const task = (tasks as LearningTask[]).find(t => t.id === active.id);
    const newStatus = over.id as TaskStatus;
    if (task && STATUS_ORDER.includes(newStatus) && task.status !== newStatus)
      moveMutation.mutate({ task, status: newStatus });
  }

  const columns = STATUS_ORDER.map(status => ({ status, tasks: (tasks as LearningTask[]).filter(t => t.status === status) }));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Планирование</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Управляйте учебными задачами</Typography>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2.5, alignItems: "start" }}>
          {columns.map(({ status, tasks: colTasks }) => (
            <KanbanColumn key={status} status={status} tasks={colTasks}
              onAddTask={() => { setDefaultStatus(status); setModalTask("new"); }}
              onEdit={t => setModalTask(t)}
              onDelete={id => deleteMutation.mutate(id)} />
          ))}
        </Box>
        <DragOverlay>
          {activeTask && (
            <Box sx={{ transform: "rotate(2deg)", opacity: 0.95, scale: "1.03" }}>
              <TaskCard task={activeTask} isOverlay />
            </Box>
          )}
        </DragOverlay>
      </DndContext>

      {modalTask !== null && (
        <TaskModal
          task={modalTask === "new" ? null : modalTask}
          defaultStatus={defaultStatus}
          onClose={() => setModalTask(null)}
          onSaved={() => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); setModalTask(null); }}
        />
      )}
    </Box>
  );
}

// ── Kanban column ──────────────────────────────────────────────────────────────
function KanbanColumn({ status, tasks, onAddTask, onEdit, onDelete }: {
  status: TaskStatus; tasks: LearningTask[]; onAddTask: () => void;
  onEdit: (t: LearningTask) => void; onDelete: (id: string) => void;
}) {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const color = STATUS_COLORS[status];

  return (
    <Box sx={{
      borderRadius: 3, border: `1px solid ${isOver ? color : theme.palette.divider}`,
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: isOver ? `0 0 0 2px ${alpha(color, 0.2)}` : "none",
      bgcolor: "background.paper",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{STATUS_LABELS[status]}</Typography>
          <Box sx={{ px: 1, py: 0.25, borderRadius: 10, bgcolor: "action.hover" }}>
            <Typography variant="caption" color="text.secondary">{tasks.length}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onAddTask}><AddIcon fontSize="small" /></IconButton>
      </Box>

      <Box ref={setNodeRef} sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5, minHeight: 140 }}>
        {tasks.map(task => <DraggableCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />)}
        {tasks.length === 0 && (
          <Box onClick={onAddTask} sx={{
            border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, py: 4,
            textAlign: "center", cursor: "pointer", color: "text.disabled",
            "&:hover": { borderColor: "text.secondary", color: "text.secondary" },
            transition: "all 0.15s",
          }}>
            <Typography variant="caption">+ Добавить задачу</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Draggable card ─────────────────────────────────────────────────────────────
function DraggableCard({ task, onEdit, onDelete }: { task: LearningTask; onEdit: (t: LearningTask) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  return (
    <Box ref={setNodeRef} style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      sx={{ opacity: isDragging ? 0.4 : 1 }} {...attributes}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} dragListeners={listeners} />
    </Box>
  );
}

// ── Task card ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, dragListeners, isOverlay }: {
  task: LearningTask; onEdit?: (t: LearningTask) => void; onDelete?: (id: string) => void;
  dragListeners?: Record<string, unknown>; isOverlay?: boolean;
}) {
  const theme = useTheme();
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "Done";

  return (
    <Card sx={{
      "&:hover .task-actions": { opacity: 1 },
      boxShadow: isOverlay ? 4 : "none",
      border: `1px solid ${isOverlay ? theme.palette.text.primary : theme.palette.divider}`,
      transition: "border-color 0.15s",
      "&:hover": { borderColor: isOverlay ? undefined : theme.palette.text.secondary },
    }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, px: 1.5, pt: 1.5, pb: task.deadline || task.materialType ? 0.5 : 1.5 }}>
        <Box {...dragListeners} sx={{ mt: 0.3, cursor: "grab", color: "text.disabled", "&:hover": { color: "text.secondary" }, touchAction: "none", flexShrink: 0 }}>
          <DragIndicatorIcon sx={{ fontSize: 16 }} />
        </Box>
        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600, lineHeight: 1.4 }}>{task.title}</Typography>
      </Box>

      {(task.deadline || (task.materialType && task.materialTitle)) && (
        <Box sx={{ px: 1.5, pb: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {task.deadline && (
            <Chip
              icon={<CalendarTodayIcon />} size="small"
              label={new Date(task.deadline).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + (isOverdue ? " · просрочено" : "")}
              color={isOverdue ? "error" : "default"}
              sx={{ height: 26, fontSize: 12, "& .MuiChip-icon": { fontSize: 14 } }}
            />
          )}
          {task.materialType && task.materialTitle && (
            <Chip
              icon={<LinkIcon />} size="small"
              label={task.materialTitle}
              component="a" href={getMaterialHref(task.materialType, task.materialId)}
              clickable onClick={e => e.stopPropagation()}
              sx={{ height: 26, fontSize: 12, "& .MuiChip-icon": { fontSize: 14 } }}
            />
          )}
        </Box>
      )}

      {!isOverlay && (
        <Box className="task-actions" sx={{ px: 1.5, pb: 1, display: "flex", gap: 0.5, opacity: 0, transition: "opacity 0.15s" }}>
          <IconButton size="small" onClick={() => onEdit?.(task)} sx={{ p: 0.5 }}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
          <IconButton size="small" onClick={() => onDelete?.(task.id)} sx={{ p: 0.5, color: "error.main" }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
        </Box>
      )}
    </Card>
  );
}

// ── Task modal ─────────────────────────────────────────────────────────────────
function TaskModal({ task, defaultStatus, onClose, onSaved }: {
  task: LearningTask | null; defaultStatus: TaskStatus; onClose: () => void; onSaved: () => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState<object | null>(task?.descriptionJson ?? null);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus);
  const [deadline, setDeadline] = useState<Dayjs | null>(
    task?.deadline ? dayjs(task.deadline) : null
  );
  const [materialType, setMaterialType] = useState<MaterialType | "">(task?.materialType ?? "");
  const [materialId, setMaterialId] = useState(task?.materialId ?? "");
  const [materialTitle, setMaterialTitle] = useState(task?.materialTitle ?? "");
  const [error, setError] = useState("");

  const { data: notes = [] } = useQuery({ queryKey: ["notes"], queryFn: getNotes, enabled: materialType === "Note" });
  const { data: decks = [] } = useQuery({ queryKey: ["decks"], queryFn: getDecks, enabled: materialType === "Deck" });
  const { data: quizzes = [] } = useQuery({ queryKey: ["quizzes"], queryFn: () => getQuizzes(), enabled: materialType === "Quiz" });

  const handleContentChange = useCallback((json: object) => setDescription(json), []);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: UpsertTaskPayload = { title: title.trim(), descriptionJson: description, status, deadline: deadline ? deadline.toISOString() : null, materialType: materialType || null, materialId: materialId || null, materialTitle: materialTitle || null };
      return task ? updateTask(task.id, payload) : createTask(payload);
    },
    onSuccess: onSaved,
    onError: () => setError("Не удалось сохранить."),
  });

  function onMaterialSelect(id: string) {
    setMaterialId(id);
    let t = "";
    if (materialType === "Note") t = (notes as { id: string; title: string }[]).find(n => n.id === id)?.title ?? "";
    if (materialType === "Deck") t = (decks as Deck[]).find(d => d.id === id)?.name ?? "";
    if (materialType === "Quiz") t = (quizzes as { id: string; title: string }[]).find(q => q.id === id)?.title ?? "";
    setMaterialTitle(t);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <Dialog open maxWidth="md" fullWidth onClose={onClose} scroll="paper">
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{task ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 3, overflow: "auto" }}>
        <TextField label="Название задачи" autoFocus fullWidth value={title} onChange={e => setTitle(e.target.value)} size="small" />

        <Box sx={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", display: "block", mb: 1 }}>Статус</Typography>
            <ToggleButtonGroup exclusive size="small" value={status} onChange={(_, v) => v && setStatus(v)} sx={{ width: "100%" }}>
              {STATUS_ORDER.map(s => (
                <ToggleButton key={s} value={s} sx={{ flex: 1, fontSize: 12 }}>{STATUS_LABELS[s]}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <DateTimePicker
            label="Дедлайн"
            value={deadline}
            onChange={setDeadline}
            slotProps={{ textField: { size: "small", fullWidth: true } }}
            format="DD.MM.YYYY HH:mm"
            ampm={false}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", display: "block", mb: 1 }}>Материал</Typography>
          <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <ToggleButtonGroup exclusive size="small" value={materialType}
              onChange={(_, v) => { if (v !== null) { setMaterialType(v); setMaterialId(""); setMaterialTitle(""); } }}>
              {(["", "Note", "Deck", "Quiz"] as const).map(type => (
                <ToggleButton key={type} value={type} sx={{ fontSize: 12 }}>
                  {type === "" ? "Без материала" : type === "Note" ? "Конспект" : type === "Deck" ? "Карточки" : "Тест"}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {materialType && (
              <FormControl size="small" fullWidth>
                <InputLabel>Выбрать</InputLabel>
                <Select value={materialId} label="Выбрать" onChange={e => onMaterialSelect(e.target.value)}>
                  <MenuItem value=""><em>— Выбрать —</em></MenuItem>
                  {materialType === "Note" && (notes as { id: string; title: string }[]).map(n => <MenuItem key={n.id} value={n.id}>{n.title}</MenuItem>)}
                  {materialType === "Deck" && (decks as Deck[]).map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                  {materialType === "Quiz" && (quizzes as { id: string; title: string }[]).map(q => <MenuItem key={q.id} value={q.id}>{q.title}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", display: "block", mb: 1 }}>Описание</Typography>
          <Box sx={{
            border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: "hidden",
            bgcolor: theme.palette.mode === "dark" ? "#1E1E1E" : "#FFFFFF", minHeight: 180,
            "& .ProseMirror": { padding: "12px", minHeight: "150px", outline: "none" },
          }}>
            <TiptapEditor content={description ?? { type: "doc", content: [] }} onChange={handleContentChange} />
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>Отмена</Button>
        <Button variant="contained" disabled={!title.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? "Сохранение..." : task ? "Сохранить" : "Создать задачу"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

