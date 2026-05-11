"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Tooltip, Divider, alpha,
} from "@mui/material";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import StyleIcon from "@mui/icons-material/Style";
import QuizIcon from "@mui/icons-material/Quiz";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED = 64;

const NAV = [
  { href: "/dashboard", label: "Главная", icon: <HomeIcon fontSize="small" />, exact: true },
  { href: "/dashboard/notes", label: "Конспекты", icon: <AutoStoriesIcon fontSize="small" /> },
  { href: "/dashboard/flashcards", label: "Карточки", icon: <StyleIcon fontSize="small" /> },
  { href: "/dashboard/quizzes", label: "Тесты", icon: <QuizIcon fontSize="small" /> },
  { href: "/dashboard/plan", label: "Планирование", icon: <CheckBoxIcon fontSize="small" /> },
];

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === "dark";
  const bg = isDark ? "#111111" : "#FAFAFA";
  const borderColor = isDark ? "#1F1F1F" : "#EBEBEB";
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const navItemSx = (active: boolean) => ({
    minHeight: 40, borderRadius: 2, px: 1.5,
    justifyContent: collapsed ? "center" : "flex-start",
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : "transparent",
    transition: "background-color 0.15s",
    "&:hover": {
      bgcolor: active
        ? alpha(theme.palette.primary.main, 0.12)
        : alpha(theme.palette.text.primary, 0.05),
    },
  });

  return (
    <Box sx={{ width, flexShrink: 0, transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
      <Box sx={{
        position: "fixed", top: 0, left: 0, width, height: "100vh",
        display: "flex", flexDirection: "column",
        bgcolor: bg, borderRight: `1px solid ${borderColor}`,
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden", zIndex: 100,
      }}>
        {/* Logo */}
        <Box sx={{ px: 2, py: 2.5, display: "flex", alignItems: "center", gap: 1.5, minHeight: 60 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 2, flexShrink: 0,
            bgcolor: "text.primary",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AutoStoriesIcon sx={{ color: "background.default", fontSize: 18 }} />
          </Box>
          {!collapsed && (
            <Typography variant="subtitle1" sx={{ fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
              Конспектум
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor }} />

        <List sx={{ px: 1, py: 1.5, flex: 1 }} disablePadding>
          {NAV.map(({ href, label, icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <ListItem key={href} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? label : ""} placement="right">
                  <ListItemButton component={Link} href={href} selected={active} sx={navItemSx(active)}>
                    <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: "inherit", justifyContent: "center" }}>
                      {icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText primary={label}
                        slotProps={{ primary: { style: { fontSize: 14, fontWeight: active ? 600 : 400 } } }} />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor }} />

        <List sx={{ px: 1, py: 1 }} disablePadding>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={collapsed ? "Настройки" : ""} placement="right">
              <ListItemButton component={Link} href="/dashboard/settings"
                selected={pathname === "/dashboard/settings"}
                sx={navItemSx(pathname === "/dashboard/settings")}>
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: "inherit", justifyContent: "center" }}>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Настройки" slotProps={{ primary: { style: { fontSize: 14 } } }} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
          <ListItem disablePadding>
            <Tooltip title={collapsed ? "Развернуть" : ""} placement="right">
              <ListItemButton onClick={onToggle} sx={{
                minHeight: 40, borderRadius: 2, px: 1.5,
                justifyContent: collapsed ? "center" : "flex-start",
                color: theme.palette.text.secondary,
                "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.05) },
              }}>
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: "inherit", justifyContent: "center" }}>
                  {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Свернуть" slotProps={{ primary: { style: { fontSize: 14 } } }} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Box>
  );
}
