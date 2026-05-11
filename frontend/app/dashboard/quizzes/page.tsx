"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Button, TextField, Card, IconButton,
  CircularProgress, LinearProgress, ToggleButtonGroup, ToggleButton,
  Radio, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FolderIcon from "@mui/icons-material/Folder";
import QuizIcon from "@mui/icons-material/Quiz";
import SearchIcon from "@mui/icons-material/Search";
import {
  getQuizzes, getQuiz, createQuiz, deleteQuiz,
  getQuizFolders, createQuizFolder, renameQuizFolder, deleteQuizFolder,
  QuizSummary, QuizDetail, QuizFolder, Question, QuestionType,
} from "@/lib/quizzes";

// ── Quiz runner ────────────────────────────────────────────────────────────────
function QuizRunner({ quiz, onClose }: { quiz: QuizDetail; onClose: () => void }) {
  const theme = useTheme();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [openResult, setOpenResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme.palette.mode === "dark";

  const question: Question = quiz.questions[current];

  function advance(wasCorrect: boolean) {
    if (wasCorrect) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= quiz.questions.length) { setFinished(true); return; }
      setCurrent(c => c + 1); setSelected(null); setTyped(""); setOpenResult(null);
    }, 900);
  }

  function handleMC(answerId: string, isCorrect: boolean) { setSelected(answerId); advance(isCorrect); }
  function handleOE() {
    if (!typed.trim() || openResult) return;
    const correct = typed.trim().toLowerCase() === (question.correctTextAnswer ?? "").trim().toLowerCase();
    setOpenResult(correct ? "correct" : "wrong");
    advance(correct);
  }

  if (finished) return (
    <Box sx={{ textAlign: "center", py: 8, maxWidth: 480, mx: "auto" }}>
      <Typography variant="h3" sx={{ fontWeight: 800,  mb: 1 }}>{score}/{quiz.questions.length}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {score === quiz.questions.length ? "Отлично! Всё верно 🎉" : "Продолжайте практиковаться!"}
      </Typography>
      <Button variant="contained" onClick={onClose}>Закрыть</Button>
    </Box>
  );

  const isOpen = question.type === "OpenEnded";
  const pct = ((current) / quiz.questions.length) * 100;

  return (
    <Box sx={{ maxWidth: 560, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="body2" color="text.secondary">Вопрос {current + 1} из {quiz.questions.length}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <LinearProgress variant="determinate" value={pct} sx={{ mb: 3, borderRadius: 4, height: 6, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "text.primary", borderRadius: 4 } }} />

      <Typography variant="h6" sx={{ fontWeight: 600,  mb: 3 }}>{question.text}</Typography>

      {isOpen ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <TextField size="small" fullWidth placeholder="Введите ваш ответ..." value={typed}
            onChange={e => setTyped(e.target.value)} onKeyDown={e => e.key === "Enter" && handleOE()}
            disabled={!!openResult} inputRef={inputRef}
            sx={openResult === "correct" ? { "& fieldset": { borderColor: "success.main !important" } } : openResult === "wrong" ? { "& fieldset": { borderColor: "error.main !important" } } : {}} />
          {openResult === "wrong" && <Typography variant="body2" color="error">Правильный ответ: <strong>{question.correctTextAnswer}</strong></Typography>}
          {openResult === "correct" && <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>Верно!</Typography>}
          {!openResult && <Button variant="contained" disabled={!typed.trim()} onClick={handleOE}>Ответить</Button>}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {question.answers.map(answer => {
            let bgcolor = isDark ? "#1E1E1E" : "#FFFFFF";
            let borderColor = theme.palette.divider;
            let textColor = theme.palette.text.primary;
            if (selected) {
              if (answer.id === selected && answer.isCorrect) { bgcolor = isDark ? "#14532D" : "#F0FDF4"; borderColor = theme.palette.success.main; textColor = theme.palette.success.main; }
              else if (answer.id === selected && !answer.isCorrect) { bgcolor = isDark ? "#450A0A" : "#FEF2F2"; borderColor = theme.palette.error.main; textColor = theme.palette.error.main; }
              else if (answer.isCorrect) { bgcolor = isDark ? "#14532D" : "#F0FDF4"; borderColor = theme.palette.success.main; textColor = theme.palette.success.main; }
            }
            return (
              <Box key={answer.id} onClick={() => !selected && handleMC(answer.id, answer.isCorrect)} sx={{
                border: `2px solid ${borderColor}`, borderRadius: 2, px: 2.5, py: 1.5,
                cursor: selected ? "default" : "pointer", bgcolor, color: textColor,
                transition: "all 0.15s", fontWeight: 500,
                "&:hover": selected ? {} : { borderColor: "text.primary", bgcolor: "action.hover" },
              }}>
                {answer.text}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// ── Create quiz form ───────────────────────────────────────────────────────────
type QuestionDraft = { text: string; type: QuestionType; correctTextAnswer: string; answers: { text: string; isCorrect: boolean }[] };

function CreateQuizForm({ onClose, folderId }: { onClose: () => void; folderId?: string | null }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { text: "", type: "MultipleChoice", correctTextAnswer: "", answers: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] },
  ]);

  const mutation = useMutation({
    mutationFn: () => createQuiz({ title, folderId, questions: questions.map(q => q.type === "OpenEnded" ? { text: q.text, type: q.type, answers: [], correctTextAnswer: q.correctTextAnswer } : { text: q.text, type: q.type, answers: q.answers }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["quizzes"] }); onClose(); },
  });

  return (
    <Box sx={{ maxWidth: 560, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Новый тест</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </Box>
      <TextField size="small" fullWidth label="Название теста" value={title} onChange={e => setTitle(e.target.value)} sx={{ mb: 3 }} />

      {questions.map((q, qi) => (
        <Card key={qi} sx={{ p: 2.5, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField size="small" fullWidth label={`Вопрос ${qi + 1}`} value={q.text}
              onChange={e => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, text: e.target.value } : x))} />
            {questions.length > 1 && (
              <IconButton size="small" onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))} sx={{ color: "error.main" }}><DeleteIcon fontSize="small" /></IconButton>
            )}
          </Box>

          <ToggleButtonGroup exclusive size="small" value={q.type} onChange={(_, v) => v && setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, type: v } : x))} sx={{ mb: 2, width: "100%" }}>
            <ToggleButton value="MultipleChoice" sx={{ flex: 1, fontSize: 13 }}>Варианты ответа</ToggleButton>
            <ToggleButton value="OpenEnded" sx={{ flex: 1, fontSize: 13 }}>Открытый вопрос</ToggleButton>
          </ToggleButtonGroup>

          {q.type === "OpenEnded" ? (
            <TextField size="small" fullWidth label="Правильный ответ" value={q.correctTextAnswer}
              onChange={e => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, correctTextAnswer: e.target.value } : x))} />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {q.answers.map((a, ai) => (
                <Box key={ai} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Radio size="small" checked={a.isCorrect} onChange={() => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, answers: x.answers.map((b, j) => ({ ...b, isCorrect: j === ai })) } : x))} />
                  <TextField size="small" fullWidth label={`Ответ ${ai + 1}`} value={a.text}
                    onChange={e => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, answers: x.answers.map((b, j) => j === ai ? { ...b, text: e.target.value } : b) } : x))} />
                  {q.answers.length > 2 && (
                    <IconButton size="small" onClick={() => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, answers: x.answers.filter((_, j) => j !== ai) } : x))}><CloseIcon fontSize="small" /></IconButton>
                  )}
                </Box>
              ))}
              <Button size="small" onClick={() => setQuestions(qs => qs.map((x, i) => i === qi ? { ...x, answers: [...x.answers, { text: "", isCorrect: false }] } : x))}>
                + Добавить ответ
              </Button>
            </Box>
          )}
        </Card>
      ))}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Button variant="outlined" onClick={() => setQuestions(qs => [...qs, { text: "", type: "MultipleChoice", correctTextAnswer: "", answers: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] }])}>
          + Добавить вопрос
        </Button>
        <Button variant="contained" disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
          Сохранить тест
        </Button>
      </Box>
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
function QuizzesContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDesc, setFolderDesc] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<QuizFolder | null>(null);
  const autoOpenedRef = useRef(false);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["quizzes", search],
    queryFn: () => getQuizzes(search || undefined),
  });
  const { data: folders = [] } = useQuery({ queryKey: ["quiz-folders"], queryFn: getQuizFolders });

  const deleteMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] }),
  });
  const createFolderMutation = useMutation({
    mutationFn: () => createQuizFolder(folderName.trim(), folderDesc.trim() || undefined),
    onSuccess: (f) => { queryClient.invalidateQueries({ queryKey: ["quiz-folders"] }); setShowFolderDialog(false); setFolderName(""); setFolderDesc(""); setSelectedFolder(f.id); },
  });
  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteQuizFolder(id),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["quiz-folders"] }); if (selectedFolder === id) setSelectedFolder("all"); },
  });
  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name, desc }: { id: string; name: string; desc: string }) => renameQuizFolder(id, name, desc || undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["quiz-folders"] }); setRenamingFolder(null); },
  });

  async function startQuiz(id: string) { const quiz = await getQuiz(id); setActiveQuiz(quiz); }

  useEffect(() => {
    const quizId = searchParams.get("quiz");
    if (quizId && !autoOpenedRef.current) { autoOpenedRef.current = true; startQuiz(quizId); }
  }, [searchParams]); // eslint-disable-line

  const filteredQuizzes = (quizzes as QuizSummary[]).filter(q =>
    search.trim() ? true : selectedFolder === "all" ? true : q.folderId === selectedFolder
  );

  if (activeQuiz) return <QuizRunner quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />;
  if (creating) return <CreateQuizForm folderId={selectedFolder !== "all" ? selectedFolder : null} onClose={() => setCreating(false)} />;

  return (
    <Box sx={{ display: "flex", gap: 3, maxWidth: 1100, mx: "auto" }}>
      {/* Folder sidebar */}
      <Box sx={{ width: 200, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", px: 1, display: "block", mb: 1 }}>
          Папки
        </Typography>
        <List dense disablePadding>
          <ListItem disablePadding>
            <ListItemButton selected={selectedFolder === "all"} onClick={() => setSelectedFolder("all")} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}><QuizIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Все тесты" slotProps={{ primary: { style: { fontSize: 14 } } }} />
              <Typography variant="caption" color="text.secondary">{(quizzes as QuizSummary[]).length}</Typography>
            </ListItemButton>
          </ListItem>
        </List>

        {(folders as QuizFolder[]).length > 0 && <Divider sx={{ my: 1 }} />}

        <List dense disablePadding>
          {(folders as QuizFolder[]).map(folder => (
            <ListItem key={folder.id} disablePadding
              secondaryAction={
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Переименовать">
                    <IconButton size="small" onClick={() => setRenamingFolder(folder)} sx={{ p: 0.5 }}>
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" onClick={() => deleteFolderMutation.mutate(folder.id)} sx={{ p: 0.5, color: "error.main" }}>
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemButton selected={selectedFolder === folder.id} onClick={() => setSelectedFolder(folder.id)} sx={{ borderRadius: 2, mb: 0.5, pr: 7 }}>
                <ListItemIcon sx={{ minWidth: 32 }}><FolderIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={folder.name} slotProps={{ primary: { style: { fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } } }} />
                <Typography variant="caption" color="text.secondary">{folder.quizCount}</Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 1 }} />
        <Button size="small" startIcon={<AddIcon />} onClick={() => setShowFolderDialog(true)} sx={{ width: "100%", justifyContent: "flex-start", px: 1 }}>
          Создать папку
        </Button>
      </Box>

      {/* Quizzes area */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {selectedFolder === "all" ? "Тесты" : ((folders as QuizFolder[]).find(f => f.id === selectedFolder)?.name ?? "Тесты")}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>Создать тест</Button>
        </Box>

        <TextField
          size="small" placeholder="Поиск по тестам..." value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 1, color: "text.disabled", fontSize: 20 }} /> } }}
          sx={{ mb: 2, maxWidth: 320 }}
        />

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress size={24} /></Box>
        ) : !filteredQuizzes.length ? (
          <Card sx={{ p: 6, textAlign: "center", border: `1px dashed ${theme.palette.divider}` }}>
            <QuizIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography sx={{ fontWeight: 600 }}>{search ? "Ничего не найдено" : "Тестов пока нет"}</Typography>
            <Typography variant="body2" color="text.secondary">{search ? "Попробуйте изменить запрос" : "Создайте первый тест"}</Typography>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {filteredQuizzes.map(quiz => (
              <Card key={quiz.id} sx={{ "&:hover": { borderColor: "text.primary" }, transition: "border-color 0.15s" }}>
                <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{quiz.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {quiz.questionCount} вопросов · {new Date(quiz.createdAt).toLocaleDateString("ru-RU")}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" size="small" onClick={() => startQuiz(quiz.id)}>Пройти</Button>
                    <IconButton size="small" onClick={() => deleteMutation.mutate(quiz.id)} sx={{ color: "error.main" }}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Create folder dialog */}
      <Dialog open={showFolderDialog} onClose={() => setShowFolderDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Новая папка</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Название" size="small" autoFocus value={folderName} onChange={e => setFolderName(e.target.value)} />
            <TextField label="Описание (необязательно)" size="small" value={folderDesc} onChange={e => setFolderDesc(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowFolderDialog(false); setFolderName(""); setFolderDesc(""); }}>Отмена</Button>
          <Button variant="contained" disabled={!folderName.trim()} onClick={() => createFolderMutation.mutate()}>Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={!!renamingFolder} onClose={() => setRenamingFolder(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Переименовать папку</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Название" size="small" autoFocus
              value={renamingFolder?.name ?? ""}
              onChange={e => setRenamingFolder(f => f ? { ...f, name: e.target.value } : null)} />
            <TextField label="Описание" size="small"
              value={renamingFolder?.description ?? ""}
              onChange={e => setRenamingFolder(f => f ? { ...f, description: e.target.value } : null)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenamingFolder(null)}>Отмена</Button>
          <Button variant="contained" disabled={!renamingFolder?.name.trim()}
            onClick={() => renamingFolder && renameFolderMutation.mutate({ id: renamingFolder.id, name: renamingFolder.name, desc: renamingFolder.description ?? "" })}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function QuizzesPage() {
  return <Suspense><QuizzesContent /></Suspense>;
}

