"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box, Card, TextField, Button, Typography, Alert,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import EmailIcon from "@mui/icons-material/Email";
import { verifyEmail, resendVerification } from "@/lib/auth";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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
    if (code.length < 6) { setError("Введите все 6 цифр."); return; }
    setError("");
    setLoading(true);
    try {
      const data = await verifyEmail(code);
      localStorage.setItem("accessToken", data.accessToken);
      router.push("/dashboard");
    } catch {
      setError("Неверный или просроченный код.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;
    try { await resendVerification(email); setCooldown(60); } catch {}
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
          <Box sx={{
            width: 56, height: 56, borderRadius: 3, mx: "auto", mb: 2,
            bgcolor: "action.hover",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <EmailIcon sx={{ color: "primary.main", fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Подтвердите email
          </Typography>
          {email && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Код отправлен на <strong>{email}</strong>
            </Typography>
          )}
        </Box>

        <Card sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, textAlign: "center" }}>
                  Введите 6-значный код
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

              <Button
                type="submit" variant="contained" fullWidth
                disabled={loading || digits.join("").length < 6}
                sx={{ py: 1.2 }}
              >
                {loading ? "Проверка..." : "Подтвердить"}
              </Button>
            </Box>
          </form>
        </Card>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2.5 }}>
          Не получили код?{" "}
          <Button
            variant="text" size="small" disabled={cooldown > 0} onClick={handleResend}
            sx={{ p: 0, minWidth: 0, fontWeight: 600, fontSize: 14, verticalAlign: "baseline" }}
          >
            {cooldown > 0 ? `Отправить снова (${cooldown}с)` : "Отправить снова"}
          </Button>
        </Typography>
      </Box>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailForm /></Suspense>;
}
