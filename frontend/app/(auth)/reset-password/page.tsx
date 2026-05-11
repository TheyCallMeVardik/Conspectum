"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box, Card, TextField, Button, Typography, Alert,
  InputAdornment, IconButton,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { resetPassword } from "@/lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0)
      inputs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Введите все 6 цифр кода."); return; }
    if (newPassword.length < 8) { setError("Пароль должен быть не менее 8 символов."); return; }
    if (newPassword !== confirmPassword) { setError("Пароли не совпадают."); return; }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      router.push("/login?reset=success");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Неверный или просроченный код.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: "auto", mb: 2, background: "linear-gradient(135deg, #0D0D0D, #404040)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AutoStoriesIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Новый пароль</Typography>
          {email && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Код отправлен на <strong>{email}</strong>
            </Typography>
          )}
        </Box>

        <Card sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {error && <Alert severity="error">{error}</Alert>}

              {/* Code input */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5, textAlign: "center" }}>
                  Введите 6-значный код из письма
                </Typography>
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }} onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <TextField
                      key={i}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e as React.KeyboardEvent<HTMLInputElement>)}
                      slotProps={{
                        htmlInput: {
                          ref: (el: HTMLInputElement | null) => { inputs.current[i] = el; },
                          maxLength: 1,
                          style: { textAlign: "center", fontSize: 22, fontWeight: 700, padding: "10px 0" },
                        },
                      }}
                      sx={{ width: 48 }}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              {/* New password */}
              <TextField
                label="Новый пароль" size="small" fullWidth
                type={showPw ? "text" : "password"}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                helperText="Минимум 8 символов"
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

              <TextField
                label="Подтвердите пароль" size="small" fullWidth
                type={showPw ? "text" : "password"}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              />

              <Button
                type="submit" variant="contained" fullWidth sx={{ py: 1.2 }}
                disabled={loading || digits.join("").length < 6 || !newPassword || !confirmPassword}
              >
                {loading ? "Сохранение..." : "Сохранить пароль"}
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

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
