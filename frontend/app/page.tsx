"use client";

import Link from "next/link";
import { Box, Button, Typography, Container, Grid, Paper } from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import StyleIcon from "@mui/icons-material/Style";
import QuizIcon from "@mui/icons-material/Quiz";

const FEATURES = [
  { icon: <AutoStoriesIcon />, title: "Конспекты", desc: "Богатое форматирование, код с подсветкой синтаксиса, полнотекстовый поиск" },
  { icon: <StyleIcon />, title: "Карточки SM-2", desc: "Умный алгоритм показывает карточки в нужный момент" },
  { icon: <QuizIcon />, title: "Тесты", desc: "Проверяй знания с вариантами ответов и мгновенной обратной связью" },
];

export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box component="header" sx={{ borderBottom: "1px solid", borderColor: "divider", px: 4, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AutoStoriesIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Конспектум</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button component={Link} href="/login" variant="text" size="small">Войти</Button>
          <Button component={Link} href="/register" variant="contained" size="small">Начать бесплатно</Button>
        </Box>
      </Box>

      {/* Hero */}
      <Container maxWidth="md" sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", py: 12, gap: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, mb: 2 }}>
            Учись быстрее с{" "}
            <Box component="span" sx={{ color: "primary.main" }}>интервальным повторением</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 480, mx: "auto", lineHeight: 1.6 }}>
            Конспекты, карточки по алгоритму SM-2, тесты и планирование — всё в одном месте.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button component={Link} href="/register" variant="contained" size="large" sx={{ px: 4 }}>
            Начать бесплатно
          </Button>
          <Button component={Link} href="/login" variant="outlined" size="large" sx={{ px: 4 }}>
            Войти
          </Button>
        </Box>

        {/* Feature cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <Grid key={title} size={{ xs: 12, sm: 4 }}>
              <Paper variant="outlined" sx={{ p: 3, height: "100%", textAlign: "left", borderRadius: 3 }}>
                <Box sx={{ color: "primary.main", mb: 1.5 }}>{icon}</Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary">{desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
