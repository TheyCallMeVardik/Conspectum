"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Card, Typography, Button, TextField, Alert, Divider,
  Avatar, IconButton, ToggleButton, ToggleButtonGroup, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import PersonIcon from "@mui/icons-material/Person";
import { useTheme } from "@/contexts/ThemeContext";
import { changePassword, deleteAccount } from "@/lib/auth";

function AvatarSection() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setAvatar(localStorage.getItem("avatar")); }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      localStorage.setItem("avatar", url);
      setAvatar(url);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Аватар</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar src={avatar ?? undefined} sx={{ width: 64, height: 64, bgcolor: "action.selected" }}>
          {!avatar && <PersonIcon sx={{ fontSize: 32 }} />}
        </Avatar>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => fileRef.current?.click()}>
            Загрузить фото
          </Button>
          {avatar && (
            <Button size="small" color="error" onClick={() => { localStorage.removeItem("avatar"); setAvatar(null); }}>
              Удалить
            </Button>
          )}
        </Box>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </Box>
    </Box>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (next !== confirm) { setError("Пароли не совпадают"); return; }
    if (next.length < 6) { setError("Минимум 6 символов"); return; }
    setStatus("loading"); setError("");
    try {
      await changePassword(current, next);
      setStatus("ok");
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setError("Неверный текущий пароль");
      setStatus("error");
    }
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Смена пароля</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 360 }}>
        <TextField size="small" type="password" label="Текущий пароль" value={current} onChange={e => setCurrent(e.target.value)} />
        <TextField size="small" type="password" label="Новый пароль" value={next} onChange={e => setNext(e.target.value)} />
        <TextField size="small" type="password" label="Подтвердите пароль" value={confirm} onChange={e => setConfirm(e.target.value)} />
        {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}
        {status === "ok" && <Alert severity="success" sx={{ py: 0 }}>Пароль изменён</Alert>}
        <Button type="submit" variant="contained" disabled={!current || !next || !confirm || status === "loading"}>
          {status === "loading" ? "Сохранение..." : "Сменить пароль"}
        </Button>
      </Box>
    </Box>
  );
}

function ThemeSection() {
  const { theme, toggle } = useTheme();
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Тема оформления</Typography>
      <ToggleButtonGroup exclusive value={theme} onChange={(_, v) => v && v !== theme && toggle()} size="small">
        <ToggleButton value="light" sx={{ gap: 1, px: 2 }}>
          <LightModeIcon fontSize="small" /> Светлая
        </ToggleButton>
        <ToggleButton value="dark" sx={{ gap: 1, px: 2 }}>
          <DarkModeIcon fontSize="small" /> Тёмная
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

function DeleteSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try { await deleteAccount(); router.push("/login"); }
    catch { setLoading(false); }
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "error.main" }}>
        Удаление аккаунта
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Это действие необратимо. Все данные будут удалены.
      </Typography>
      <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
        Удалить аккаунт
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Вы уверены?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Все ваши конспекты, карточки и тесты будут безвозвратно удалены.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button color="error" variant="contained" disabled={loading} onClick={handleDelete}>
            {loading ? "Удаляем..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em", mb: 3 }}>Настройки</Typography>
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <AvatarSection />
          <Divider />
          <PasswordSection />
          <Divider />
          <ThemeSection />
          <Divider />
          <DeleteSection />
        </Box>
      </Card>
    </Box>
  );
}

