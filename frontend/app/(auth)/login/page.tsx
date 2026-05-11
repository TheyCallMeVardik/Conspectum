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
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem("accessToken", data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      const body = err.response?.data;
      if (body?.error === "email_not_verified" && body?.email) {
        router.push(`/verify-email?email=${encodeURIComponent(body.email)}`);
        return;
      }
      setError(body?.error ?? "Неверный email или пароль");
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
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5, mx: "auto", mb: 2,
            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AutoStoriesIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Добро пожаловать</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Войдите в аккаунт, чтобы продолжить
          </Typography>
        </Box>

        <Card sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {error && <Alert severity="error" sx={{ fontSize: 14 }}>{error}</Alert>}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                fullWidth
                size="small"
              />
              <TextField
                label="Пароль"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                fullWidth
                size="small"
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
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ py: 1.2, mt: 0.5 }}
              >
                {loading ? "Вход..." : "Войти"}
              </Button>
            </Box>
          </form>
        </Card>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2.5 }}>
          <Link href="/forgot-password" style={{ color: "inherit", textDecoration: "none" }}>
            Забыли пароль?
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Нет аккаунта?{" "}
          <Link href="/register" style={{ color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>
            Зарегистрироваться
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
