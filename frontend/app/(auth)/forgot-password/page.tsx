"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Card, TextField, Button, Typography, Alert } from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("Не удалось отправить код. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
        <Box sx={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
            <AutoStoriesIcon sx={{ fontSize: 28, color: "text.secondary" }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Письмо отправлено</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Если аккаунт с адресом <strong>{email}</strong> существует, на него придёт код для сброса пароля.
          </Typography>
          <Button
            variant="contained" fullWidth
            onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
          >
            Ввести код
          </Button>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>← Назад к входу</Link>
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: "auto", mb: 2, background: "linear-gradient(135deg, #0D0D0D, #404040)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AutoStoriesIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Восстановление пароля</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Введите email — отправим код для сброса пароля
          </Typography>
        </Box>

        <Card sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth size="small" autoFocus />
              <Button type="submit" variant="contained" fullWidth disabled={loading || !email} sx={{ py: 1.2 }}>
                {loading ? "Отправка..." : "Отправить код"}
              </Button>
            </Box>
          </form>
        </Card>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2.5 }}>
          <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>← Назад к входу</Link>
        </Typography>
      </Box>
    </Box>
  );
}
