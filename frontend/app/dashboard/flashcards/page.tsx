"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Button, TextField, Chip, Tabs, Tab, Card,
  IconButton, Tooltip, LinearProgress, CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import StyleIcon from "@mui/icons-material/Style";
import {
  getFlashcards, getDueCards, createFlashcard, deleteFlashcard, reviewFlashcard,
  getDecks, createDeck, deleteDeck, Flashcard, Deck,
} from "@/lib/flashcards";

// ── Flip card mode ─────────────────────────────────────────────────────────────
function FlashcardMode({ cards, onReview }: { cards: Flashcard[]; onReview: (id: string, q: number) => void }) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState<Flashcard[]>(cards);
  const [done, setDone] = useState(false);

  const shuffle = useCallback(() => {
    setShuffled([...cards].sort(() => Math.random() - 0.5));
    setIndex(0); setFlipped(false); setDone(false);
  }, [cards]);

  useEffect(() => { setShuffled(cards); setIndex(0); setFlipped(false); setDone(false); }, [cards]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === " ") { e.preventDefault(); setFlipped(f => !f); }
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const card = shuffled[index];
  function goNext() { if (index + 1 >= shuffled.length) { setDone(true); return; } setIndex(i => i + 1); setFlipped(false); }
  function goPrev() { if (index === 0) return; setIndex(i => i - 1); setFlipped(false); }
  function handleAnswer(quality: number) { onReview(card.id, quality); goNext(); }

  const isDark = theme.palette.mode === "dark";
  const cardBg = isDark ? "#1E1E1E" : "#FFFFFF";
  const backBg = isDark ? "#252525" : "#F7F7F7";

  if (!card) return (
    <Card sx={{ p: 6, textAlign: "center", border: `1px dashed ${theme.palette.divider}` }}>
      <Typography sx={{ fontWeight: 600 }}>Нет карточек</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Добавьте карточки во вкладке «Добавить»</Typography>
    </Card>
  );

  if (done) return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 3 }}>
      <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "action.selected", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckIcon sx={{ fontSize: 32 }} />
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Все карточки пройдены!</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Хотите пройти ещё раз?</Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button variant="outlined" onClick={() => { setIndex(0); setFlipped(false); setDone(false); }}>С начала</Button>
        <Button variant="contained" onClick={shuffle} startIcon={<ShuffleIcon />}>Перемешать</Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Progress bar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">{index + 1} / {shuffled.length}</Typography>
        <Box sx={{ flex: 1 }}>
          <LinearProgress variant="determinate" value={((index + 1) / shuffled.length) * 100}
            sx={{ borderRadius: 4, height: 6, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "text.primary", borderRadius: 4 } }} />
        </Box>
        <Tooltip title="Перемешать"><IconButton size="small" onClick={shuffle}><ShuffleIcon fontSize="small" /></IconButton></Tooltip>
      </Box>

      {/* Card + arrows */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton onClick={goPrev} disabled={index === 0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>‹</Box>
        </IconButton>

        <Box sx={{ flex: 1, perspective: "1200px", height: 280, cursor: "pointer" }} onClick={() => setFlipped(f => !f)}>
          <Box sx={{
            position: "relative", width: "100%", height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}>
            <Box sx={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", bgcolor: cardBg, border: `1px solid ${theme.palette.divider}`, borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4, textAlign: "center", gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.front}</Typography>
              <Typography variant="caption" color="text.disabled">Нажмите чтобы перевернуть · Пробел</Typography>
            </Box>
            <Box sx={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", bgcolor: backBg, border: `1px solid ${theme.palette.divider}`, borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4, textAlign: "center", gap: 2, transform: "rotateY(180deg)" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "text.secondary" }}>Определение</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.back}</Typography>
            </Box>
          </Box>
        </Box>

        <IconButton onClick={goNext} sx={{ border: `1px solid ${theme.palette.divider}` }}>
          <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>›</Box>
        </IconButton>
      </Box>

      {/* Answer buttons */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, opacity: flipped ? 1 : 0, pointerEvents: flipped ? "auto" : "none", transition: "opacity 0.2s" }}>
        <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={() => handleAnswer(0)} sx={{ py: 1.5 }}>Ещё учу</Button>
        <Button variant="outlined" color="success" startIcon={<CheckIcon />} onClick={() => handleAnswer(5)} sx={{ py: 1.5 }}>Знаю!</Button>
      </Box>
      <Typography variant="caption" color="text.disabled" align="center">← → для навигации · Пробел для переворота</Typography>
    </Box>
  );
}

// ── Learn mode ─────────────────────────────────────────────────────────────────
const LEARN_BATCH = 10;
type MCItem = { kind: "mc"; card: Flashcard; choices: string[] };
type OEItem = { kind: "oe"; card: Flashcard };
type LQItem = MCItem | OEItem;

function makeLearnMC(card: Flashcard, all: Flashcard[]): MCItem {
  const wrong = [...all.filter(c => c.id !== card.id)].sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.back);
  return { kind: "mc", card, choices: [...wrong, card.back].sort(() => Math.random() - 0.5) };
}
function spliceRandom<T>(arr: T[], item: T): T[] {
  if (!arr.length) return [item];
  const copy = [...arr]; copy.splice(1 + Math.floor(Math.random() * arr.length), 0, item); return copy;
}

function LearnMode({ cards }: { cards: Flashcard[] }) {
  const theme = useTheme();
  const total = cards.length;
  const [queue, setQueue] = useState<LQItem[]>(() => cards.slice(0, LEARN_BATCH).map(c => makeLearnMC(c, cards)));
  const [pool, setPool] = useState<Flashcard[]>(cards.slice(LEARN_BATCH));
  const [phase1Left, setPhase1Left] = useState(Math.min(LEARN_BATCH, total));
  const [done, setDone] = useState(0);
  const [mcSelected, setMcSelected] = useState<string | null>(null);
  const [oeInput, setOeInput] = useState("");
  const [oeResult, setOeResult] = useState<"correct" | "wrong" | null>(null);
  const [oeWrong, setOeWrong] = useState("");
  const oeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (queue.length === 0 && phase1Left === 0 && pool.length > 0) {
      const next = pool.slice(0, LEARN_BATCH);
      setPool(p => p.slice(LEARN_BATCH)); setPhase1Left(next.length);
      setQueue(next.map(c => makeLearnMC(c, cards)));
    }
  }, [queue.length, phase1Left, pool.length]); // eslint-disable-line

  useEffect(() => { if (queue[0]?.kind === "oe" && !oeResult) setTimeout(() => oeRef.current?.focus(), 60); }, [queue, oeResult]);

  if (total === 0) return <Card sx={{ p: 6, textAlign: "center", border: `1px dashed ${theme.palette.divider}` }}><Typography sx={{ fontWeight: 600 }}>Нет карточек</Typography></Card>;

  const current = queue[0];
  const pct = Math.round((done / total) * 100);

  if (!current && !pool.length) return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 3 }}>
      <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "success.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckIcon sx={{ fontSize: 32, color: "#fff" }} />
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Все {total} карточек освоены!</Typography>
      </Box>
      <Button variant="contained" onClick={() => { setQueue(cards.slice(0, LEARN_BATCH).map(c => makeLearnMC(c, cards))); setPool(cards.slice(LEARN_BATCH)); setPhase1Left(Math.min(LEARN_BATCH, total)); setDone(0); }}>
        Начать заново
      </Button>
    </Box>
  );

  if (!current) return null;
  const isMC = current.kind === "mc";

  function handleMC(choice: string) {
    if (mcSelected || current?.kind !== "mc") return;
    const card = current.card;
    const isCorrect = choice === card.back;
    setMcSelected(choice);
    setTimeout(() => {
      setMcSelected(null);
      if (phase1Left > 0) {
        const newLeft = phase1Left - 1;
        setPhase1Left(newLeft);
        const toAdd = isCorrect ? ({ kind: "oe", card } as OEItem) : makeLearnMC(card, cards);
        setQueue(q => { const rest = q.slice(1); const appended = [...rest, toAdd]; return newLeft === 0 ? appended.sort(() => Math.random() - 0.5) : appended; });
      } else {
        if (isCorrect) setQueue(q => spliceRandom(q.slice(1), { kind: "oe", card } as OEItem));
        else setQueue(q => spliceRandom(q.slice(1), makeLearnMC(card, cards)));
      }
    }, 900);
  }

  function handleOE() {
    if (oeResult || current?.kind !== "oe" || !oeInput.trim()) return;
    const isCorrect = oeInput.trim().toLowerCase() === current.card.back.trim().toLowerCase();
    if (isCorrect) {
      setOeResult("correct");
      setTimeout(() => { setOeResult(null); setOeInput(""); setDone(d => d + 1); setQueue(q => q.slice(1)); }, 800);
    } else {
      setOeWrong(oeInput.trim()); setOeResult("wrong");
      setTimeout(() => { setOeResult(null); setOeInput(""); setOeWrong(""); setQueue(q => spliceRandom(q.slice(1), { kind: "oe", card: current.card } as OEItem)); }, 1500);
    }
  }

  const isDark = theme.palette.mode === "dark";
  const mcCorrect = isMC && mcSelected === current.card.back;
  const mcWrong = isMC && mcSelected !== null && mcSelected !== current.card.back;
  const borderColor = oeResult === "correct" || mcCorrect ? theme.palette.success.main : oeResult === "wrong" || mcWrong ? theme.palette.error.main : theme.palette.divider;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Card sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>{done} освоено</Typography>
          <Typography variant="caption" color="text.secondary">{total - done} осталось</Typography>
        </Box>
        <LinearProgress variant="determinate" value={pct} sx={{ borderRadius: 4, height: 6, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "success.main", borderRadius: 4 } }} />
      </Card>

      <Card sx={{ border: `2px solid ${borderColor}`, transition: "border-color 0.3s" }}>
        <Box sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: "action.hover" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
            {isMC ? (phase1Left > 0 ? "Выберите перевод" : "Повтор") : "Введите перевод"}
          </Typography>
        </Box>
        <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{current.card.front}</Typography>
        </Box>
        <Box sx={{ px: 3, pb: 3 }}>
          {isMC ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              {(current as MCItem).choices.map((choice, i) => {
                let bgcolor = isDark ? "#1E1E1E" : "#FFFFFF";
                let borderCol = theme.palette.divider;
                let textColor = theme.palette.text.primary;
                if (mcSelected) {
                  if (choice === current.card.back) { bgcolor = isDark ? "#14532D" : "#F0FDF4"; borderCol = theme.palette.success.main; textColor = theme.palette.success.main; }
                  else if (choice === mcSelected) { bgcolor = isDark ? "#450A0A" : "#FEF2F2"; borderCol = theme.palette.error.main; textColor = theme.palette.error.main; }
                  else { borderCol = theme.palette.divider; textColor = theme.palette.text.disabled; }
                }
                return (
                  <Box key={i} onClick={() => !mcSelected && handleMC(choice)} sx={{
                    border: `2px solid ${borderCol}`, borderRadius: 2, p: 2, textAlign: "center",
                    cursor: mcSelected ? "default" : "pointer", bgcolor, color: textColor,
                    transition: "all 0.15s", fontWeight: 600, fontSize: 15,
                    "&:hover": mcSelected ? {} : { borderColor: "text.primary", bgcolor: "action.hover" },
                    opacity: mcSelected && choice !== current.card.back && choice !== mcSelected ? 0.4 : 1,
                  }}>
                    {choice}
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box>
              {oeResult === "wrong" && (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 1.5 }}>
                  <Card sx={{ p: 1.5, border: `1px solid ${theme.palette.error.main}`, bgcolor: isDark ? "#450A0A" : "#FEF2F2" }}>
                    <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>Ваш ответ</Typography>
                    <Typography variant="body2" sx={{ textDecoration: "line-through", color: "error.main", fontWeight: 600 }}>{oeWrong}</Typography>
                  </Card>
                  <Card sx={{ p: 1.5, border: `1px solid ${theme.palette.success.main}`, bgcolor: isDark ? "#14532D" : "#F0FDF4" }}>
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>Правильный ответ</Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>{current.card.back}</Typography>
                  </Card>
                </Box>
              )}
              {oeResult === "correct" && (
                <Card sx={{ p: 1.5, border: `1px solid ${theme.palette.success.main}`, bgcolor: isDark ? "#14532D" : "#F0FDF4", display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <CheckIcon color="success" />
                  <Box><Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>Верно!</Typography><Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>{current.card.back}</Typography></Box>
                </Card>
              )}
              {!oeResult && (
                <Box component="form" onSubmit={e => { e.preventDefault(); handleOE(); }} sx={{ display: "flex", gap: 1 }}>
                  <TextField size="small" fullWidth placeholder="Введите перевод..." value={oeInput}
                    onChange={e => setOeInput(e.target.value)} inputRef={oeRef} autoComplete="off" />
                  <Button type="submit" variant="contained" disabled={!oeInput.trim()}>Ответить</Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}

// ── DeckView ───────────────────────────────────────────────────────────────────
function DeckView({ deck, onBack }: { deck: Deck | null; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const deckId = deck?.id;

  const { data: cards = [] } = useQuery({ queryKey: ["flashcards", deckId ?? "all"], queryFn: () => getFlashcards(deckId) });
  const { data: session } = useQuery({ queryKey: ["flashcards-due", deckId ?? "all"], queryFn: () => getDueCards(deckId) });

  const createMutation = useMutation({
    mutationFn: () => createFlashcard(front, back, deckId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["flashcards", deckId ?? "all"] }); queryClient.invalidateQueries({ queryKey: ["decks"] }); setFront(""); setBack(""); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFlashcard,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["flashcards", deckId ?? "all"] }); queryClient.invalidateQueries({ queryKey: ["decks"] }); },
  });
  const reviewMutation = useMutation({
    mutationFn: ({ id, quality }: { id: string; quality: number }) => reviewFlashcard(id, quality),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flashcards-due", deckId ?? "all"] }),
  });

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} variant="text" onClick={onBack} sx={{ color: "text.secondary" }}>Все колоды</Button>
        {session && (
          <Chip label={session.dueCount > 0 ? `${session.dueCount} к повторению` : "Всё повторено ✓"}
            color={session.dueCount > 0 ? "error" : "default"} size="small" />
        )}
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{deck ? deck.name : "Все карточки"}</Typography>
      {deck?.description && <Typography variant="body2" color="text.secondary">{deck.description}</Typography>}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{(cards as Flashcard[]).length} карточек</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, "& .MuiTabs-indicator": { bgcolor: "text.primary" }, "& .Mui-selected": { color: "text.primary !important", fontWeight: 600 } }}>
        <Tab label="Карточки" />
        <Tab label="Заучивание" />
        <Tab label="Все" />
        <Tab label="Добавить" />
      </Tabs>

      {tab === 0 && <FlashcardMode cards={cards as Flashcard[]} onReview={(id, q) => reviewMutation.mutate({ id, quality: q })} />}
      {tab === 1 && <LearnMode key={(cards as Flashcard[]).length} cards={cards as Flashcard[]} />}
      {tab === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {!(cards as Flashcard[]).length
            ? <Typography color="text.secondary">Карточек ещё нет</Typography>
            : (cards as Flashcard[]).map(card => (
              <Card key={card.id} sx={{ p: 2, "&:hover": { borderColor: "text.primary" }, transition: "border-color 0.15s" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{card.front}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{card.back}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                    <Typography variant="caption" sx={{ bgcolor: "action.hover", px: 1, py: 0.5, borderRadius: 1 }}>×{card.interval}д</Typography>
                    <IconButton size="small" onClick={() => deleteMutation.mutate(card.id)} sx={{ color: "error.main" }}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Card>
            ))
          }
        </Box>
      )}
      {tab === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700,  mb: 3 }}>Новая карточка</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField size="small" label="Термин" placeholder="Что такое SM-2?" value={front} onChange={e => setFront(e.target.value)} fullWidth />
            <TextField size="small" label="Определение" placeholder="Алгоритм интервального повторения" value={back} onChange={e => setBack(e.target.value)} fullWidth
              onKeyDown={e => e.key === "Enter" && createMutation.mutate()} />
            <Button variant="contained" disabled={!front.trim() || !back.trim()} onClick={() => createMutation.mutate()} fullWidth>
              {createMutation.isPending ? "Добавляем..." : "Добавить карточку"}
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
function FlashcardsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [activeDeck, setActiveDeck] = useState<Deck | null | "all">(undefined as unknown as Deck);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const theme = useTheme();

  const { data: decks = [], isLoading } = useQuery({ queryKey: ["decks"], queryFn: getDecks });

  useEffect(() => {
    const deckId = searchParams.get("deck");
    if (!deckId || !(decks as Deck[]).length) return;
    if (activeDeck !== (undefined as unknown as Deck)) return;
    const found = (decks as Deck[]).find(d => d.id === deckId);
    if (found) setActiveDeck(found);
  }, [searchParams, decks]); // eslint-disable-line

  const createMutation = useMutation({
    mutationFn: () => createDeck(newName, newDesc || undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["decks"] }); setNewName(""); setNewDesc(""); setCreating(false); },
  });
  const deleteDeckMutation = useMutation({
    mutationFn: deleteDeck,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["decks"] }),
  });

  if (activeDeck !== (undefined as unknown as Deck)) {
    return <DeckView deck={activeDeck === "all" ? null : activeDeck} onBack={() => setActiveDeck(undefined as unknown as Deck)} />;
  }

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Карточки</Typography>
          <Typography variant="body2" color="text.secondary">Учите по колодам или все сразу</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>Новая колода</Button>
      </Box>

      {creating && (
        <Card sx={{ p: 2.5, mb: 2, border: `1px solid ${theme.palette.text.primary}` }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600,  mb: 1.5 }}>Новая колода</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField size="small" label="Название" autoFocus value={newName} onChange={e => setNewName(e.target.value)} fullWidth />
            <TextField size="small" label="Описание (необязательно)" value={newDesc} onChange={e => setNewDesc(e.target.value)} fullWidth onKeyDown={e => e.key === "Enter" && newName.trim() && createMutation.mutate()} />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" disabled={!newName.trim()} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Создаём..." : "Создать"}</Button>
              <Button variant="outlined" onClick={() => { setCreating(false); setNewName(""); setNewDesc(""); }}>Отмена</Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* All cards tile */}
      <Card sx={{ mb: 1.5, cursor: "pointer", "&:hover": { borderColor: "text.primary" }, transition: "border-color 0.15s" }} onClick={() => setActiveDeck("all")}>
        <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "action.selected", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <StyleIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Все карточки</Typography>
            <Typography variant="body2" color="text.secondary">Все колоды вместе</Typography>
          </Box>
        </Box>
      </Card>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress size={24} /></Box>
      ) : !(decks as Deck[]).length ? (
        <Card sx={{ p: 5, textAlign: "center", border: `1px dashed ${theme.palette.divider}` }}>
          <Typography variant="body2" color="text.secondary">Колод пока нет. Создайте первую.</Typography>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {(decks as Deck[]).map(deck => (
            <Card key={deck.id} sx={{ cursor: "pointer", "&:hover": { borderColor: "text.primary" }, transition: "border-color 0.15s" }}>
              <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={() => setActiveDeck(deck)}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "action.selected", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <StyleIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{deck.name}</Typography>
                    {deck.description && <Typography variant="body2" color="text.secondary">{deck.description}</Typography>}
                    <Typography variant="caption" color="text.secondary">{deck.cardCount} карточек</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={e => { e.stopPropagation(); deleteDeckMutation.mutate(deck.id); }} sx={{ color: "error.main" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function FlashcardsPage() {
  return <Suspense><FlashcardsContent /></Suspense>;
}

