"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box, Card, TextField, Button, Typography, Alert, InputAdornment, IconButton,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(email, password, confirmPassword);
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      const apiError = err.response?.data;
      if (apiError?.validationErrors) {
        setError(Object.values(apiError.validationErrors).flat().join(", ") as string);
      } else {
        setError(apiError?.error ?? "Ошибка регистрации");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      bgcolor: "background.default", p: 2,
    }}>
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5, mx: "auto", mb: 2,
            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AutoStoriesIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Создайте аккаунт</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Начните учиться бесплатно
          </Typography>
        </Box>

        <Card sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {error && <Alert severity="error" sx={{ fontSize: 14 }}>{error}</Alert>}
              <TextField label="Email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required fullWidth size="small" />
              <TextField
                label="Пароль"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required fullWidth size="small"
                helperText="Минимум 8 символов, 1 заглавная, 1 цифра"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPw(v => !v)} edge="end">
                          {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField label="Подтвердите пароль" type={showPw ? "text" : "password"}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                required fullWidth size="small" />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.2, mt: 0.5 }}>
                {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
              </Button>
            </Box>
          </form>
        </Card>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2.5 }}>
          Уже есть аккаунт?{" "}
          <Link href="/login" style={{ color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>
            Войти
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
