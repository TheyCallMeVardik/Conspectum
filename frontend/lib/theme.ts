import { createTheme, alpha } from "@mui/material/styles";

const base = {
  fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  h1: { fontWeight: 700, letterSpacing: "-0.02em" },
  h2: { fontWeight: 700, letterSpacing: "-0.015em" },
  h3: { fontWeight: 600, letterSpacing: "-0.01em" },
  h4: { fontWeight: 600, letterSpacing: "-0.01em" },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  button: { textTransform: "none" as const, fontWeight: 500 },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary:    { main: "#0D0D0D", light: "#404040", dark: "#000000", contrastText: "#FFFFFF" },
    secondary:  { main: "#6B6B6B", contrastText: "#FFFFFF" },
    background: { default: "#FFFFFF", paper: "#F7F7F7" },
    text:       { primary: "#0D0D0D", secondary: "#6B6B6B", disabled: "#ABABAB" },
    divider:    "#E5E5E5",
    action: {
      hover:    alpha("#000000", 0.05),
      selected: alpha("#000000", 0.08),
    },
    error:   { main: "#DC2626" },
    success: { main: "#16A34A" },
    warning: { main: "#D97706" },
  },
  typography: base,
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: "#FFFFFF" } },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, boxShadow: "none", "&:hover": { boxShadow: "none" },
          "&.MuiButton-containedPrimary": { backgroundColor: "#0D0D0D", "&:hover": { backgroundColor: "#1F1F1F" } },
          "&.MuiButton-outlinedPrimary": { borderColor: "#E5E5E5", color: "#0D0D0D", "&:hover": { borderColor: "#0D0D0D", backgroundColor: alpha("#000", 0.03) } },
        },
      },
    },
    MuiPaper:       { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiCard:        { styleOverrides: { root: { border: "1px solid #E5E5E5", boxShadow: "none", borderRadius: 12, backgroundImage: "none" } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "& fieldset": { borderColor: "#E5E5E5" },
          "&:hover fieldset": { borderColor: "#ABABAB" },
          "&.Mui-focused fieldset": { borderColor: "#0D0D0D" },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-selected": { backgroundColor: alpha("#000", 0.07), "&:hover": { backgroundColor: alpha("#000", 0.1) } },
        },
      },
    },
    MuiChip:   { styleOverrides: { root: { borderRadius: 6 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiAlert:  { styleOverrides: { root: { borderRadius: 8 } } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px !important",
          "&.Mui-selected": { backgroundColor: "#0D0D0D", color: "#FFFFFF", "&:hover": { backgroundColor: "#1F1F1F" } },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#FFFFFF", light: "#FFFFFF", dark: "#E5E5E5", contrastText: "#0D0D0D" },
    secondary:  { main: "#8E8EA0", contrastText: "#FFFFFF" },
    background: { default: "#0D0D0D", paper: "#171717" },
    text:       { primary: "#EDEDEC", secondary: "#8E8EA0", disabled: "#555565" },
    divider:    "#2D2D2D",
    action: {
      hover:    alpha("#FFFFFF", 0.06),
      selected: alpha("#FFFFFF", 0.1),
    },
    error:   { main: "#F87171" },
    success: { main: "#4ADE80" },
    warning: { main: "#FBBF24" },
  },
  typography: base,
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: "#0D0D0D" } },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, boxShadow: "none", "&:hover": { boxShadow: "none" },
          "&.MuiButton-containedPrimary": { backgroundColor: "#FFFFFF", color: "#0D0D0D", "&:hover": { backgroundColor: "#E5E5E5" } },
          "&.MuiButton-outlinedPrimary": { borderColor: "#2D2D2D", color: "#EDEDEC", "&:hover": { borderColor: "#555555", backgroundColor: alpha("#FFF", 0.04) } },
        },
      },
    },
    MuiPaper:       { styleOverrides: { root: { backgroundImage: "none", backgroundColor: "#171717" } } },
    MuiCard:        { styleOverrides: { root: { border: "1px solid #2D2D2D", boxShadow: "none", borderRadius: 12, backgroundImage: "none", backgroundColor: "#171717" } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#1E1E1E",
          "& fieldset": { borderColor: "#2D2D2D" },
          "&:hover fieldset": { borderColor: "#555555" },
          "&.Mui-focused fieldset": { borderColor: "#FFFFFF" },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-selected": { backgroundColor: alpha("#FFF", 0.09), "&:hover": { backgroundColor: alpha("#FFF", 0.12) } },
        },
      },
    },
    MuiChip:   { styleOverrides: { root: { borderRadius: 6 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16, backgroundColor: "#1E1E1E", border: "1px solid #2D2D2D" } } },
    MuiAlert:  { styleOverrides: { root: { borderRadius: 8 } } },
    MuiDivider: { styleOverrides: { root: { borderColor: "#2D2D2D" } } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px !important",
          borderColor: "#2D2D2D",
          color: "#8E8EA0",
          "&.Mui-selected": { backgroundColor: "#FFFFFF", color: "#0D0D0D", "&:hover": { backgroundColor: "#E5E5E5" } },
        },
      },
    },
  },
});
