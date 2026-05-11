"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardActionArea, Typography, Grid, Skeleton, alpha } from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import StyleIcon from "@mui/icons-material/Style";
import QuizIcon from "@mui/icons-material/Quiz";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getTasks } from "@/lib/learningTasks";
import { getNotes } from "@/lib/notes";
import { getDecks } from "@/lib/flashcards";
import { getQuizzes } from "@/lib/quizzes";

function StatCard({ label, value, icon, color, href, warn }: {
  label: string; value: number | undefined; icon: React.ReactNode;
  color: string; href: string; warn?: boolean;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea component={Link} href={href} sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2,
          bgcolor: alpha(color, 0.12),
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Box>
          {value === undefined
            ? <Skeleton width={40} height={32} />
            : <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>{value}</Typography>
          }
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
            {warn && <WarningAmberIcon sx={{ fontSize: 14, color: "error.main" }} />}
            {label}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}

const SECTIONS = [
  { href: "/dashboard/notes",      label: "Конспекты",    desc: "Записывай материал",      icon: <AutoStoriesIcon />, color: "#7C3AED" },
  { href: "/dashboard/flashcards", label: "Карточки",     desc: "Запоминай термины",        icon: <StyleIcon />,       color: "#0EA5E9" },
  { href: "/dashboard/quizzes",    label: "Тесты",        desc: "Проверяй знания",          icon: <QuizIcon />,        color: "#10B981" },
  { href: "/dashboard/plan",       label: "Планирование", desc: "Следи за дедлайнами",      icon: <CheckBoxIcon />,    color: "#F59E0B" },
];

export default function DashboardPage() {
  const { data: tasks } = useQuery({ queryKey: ["tasks"], queryFn: getTasks });
  const { data: notes } = useQuery({ queryKey: ["notes"], queryFn: getNotes });
  const { data: decks } = useQuery({ queryKey: ["decks"], queryFn: getDecks });
  const { data: quizzes } = useQuery({ queryKey: ["quizzes"], queryFn: () => getQuizzes() });

  const overdue = tasks?.filter((t: any) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "Done").length ?? 0;
  const activeTasks = tasks?.filter((t: any) => t.status !== "Done").length;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          Добро пожаловать 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Продолжай учиться — каждый день имеет значение
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Конспекты" value={(notes as any[])?.length} icon={<AutoStoriesIcon fontSize="small" />} color="#7C3AED" href="/dashboard/notes" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Колоды" value={(decks as any[])?.length} icon={<StyleIcon fontSize="small" />} color="#0EA5E9" href="/dashboard/flashcards" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Тесты" value={(quizzes as any[])?.length} icon={<QuizIcon fontSize="small" />} color="#10B981" href="/dashboard/quizzes" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label={overdue > 0 ? `${overdue} просрочено` : "Активные задачи"} value={activeTasks} icon={<CheckBoxIcon fontSize="small" />} color={overdue > 0 ? "#EF4444" : "#F59E0B"} href="/dashboard/plan" warn={overdue > 0} />
        </Grid>
      </Grid>

      {/* Sections */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 11, fontWeight: 600 }}>
        Разделы
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {SECTIONS.map(({ href, label, desc, icon, color }) => (
          <Card key={href}>
            <CardActionArea component={Link} href={href} sx={{
              p: 2.5, display: "flex", alignItems: "center", gap: 2,
              "&:hover .section-icon": { transform: "scale(1.1)" },
            }}>
              <Box className="section-icon" sx={{
                width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                bgcolor: alpha(color, 0.1),
                display: "flex", alignItems: "center", justifyContent: "center",
                color, transition: "transform 0.2s",
              }}>
                {icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{label}</Typography>
                <Typography variant="body2" color="text.secondary">{desc}</Typography>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

