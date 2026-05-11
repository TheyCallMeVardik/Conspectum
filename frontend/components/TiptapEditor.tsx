"use client";

import { useRef, useEffect, useState } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import BaseImage from "@tiptap/extension-image";
import { Plugin } from "@tiptap/pm/state";
import { common, createLowlight } from "lowlight";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  Box, Tooltip, IconButton, Divider, TextField, Button,
  Checkbox, FormControlLabel, Popover,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import CodeIcon from "@mui/icons-material/Code";
import ImageIcon from "@mui/icons-material/Image";
import FunctionsIcon from "@mui/icons-material/Functions";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import ResizableImage from "./ResizableImage";
import MathNodeView from "./MathNodeView";

const lowlight = createLowlight(common);

// ── Extensions ────────────────────────────────────────────────────────────────

const TabHandler = Extension.create({
  name: "tabHandler",
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (!this.editor.isActive("codeBlock")) return false;
        this.editor.chain().focus().insertContent("  ").run();
        return true;
      },
    };
  },
});

const ImagePasteHandler = Extension.create({
  name: "imagePasteHandler",
  addProseMirrorPlugins() {
    return [new Plugin({ props: { handlePaste: (_view, event) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageItem = items.find(i => i.type.startsWith("image/"));
      if (!imageItem) return false;
      const file = imageItem.getAsFile();
      if (!file) return false;
      const reader = new FileReader();
      reader.onload = e => { const src = e.target?.result as string; this.editor.chain().focus().setImage({ src }).run(); };
      reader.readAsDataURL(file);
      return true;
    }}})];
  },
});

const CustomImage = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: { default: "center", parseHTML: el => (el as HTMLElement).getAttribute("data-align") ?? "center", renderHTML: attrs => ({ "data-align": attrs.align }) },
      width: { default: 400, parseHTML: el => { const w = (el as HTMLElement).getAttribute("width"); return w ? parseInt(w) : 400; }, renderHTML: attrs => ({ width: attrs.width }) },
    };
  },
  addNodeView() { return ReactNodeViewRenderer(ResizableImage); },
}).configure({ allowBase64: true, inline: false });

const MathNode = Node.create({
  name: "math",
  group: "inline", inline: true, atom: true, selectable: true,
  addAttributes() { return { latex: { default: "" }, display: { default: false } }; },
  parseHTML() { return [{ tag: "span[data-math]" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", mergeAttributes({ "data-math": "" }, HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(MathNodeView); },
  addCommands() {
    return {
      insertMath: (latex: string, display = false) => ({ commands }: { commands: { insertContent: (c: unknown) => boolean } }) =>
        commands.insertContent({ type: "math", attrs: { latex, display } }),
    } as never;
  },
});

const MATH_TEMPLATES = [
  { label: "Дробь", latex: "\\frac{a}{b}" },
  { label: "Корень", latex: "\\sqrt{x}" },
  { label: "Степень", latex: "x^{n}" },
  { label: "Индекс", latex: "x_{n}" },
  { label: "Сумма", latex: "\\sum_{i=1}^{n}" },
  { label: "Интеграл", latex: "\\int_{a}^{b}" },
  { label: "Предел", latex: "\\lim_{x \\to 0}" },
  { label: "Матрица", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
];

const MATH_SYMBOLS = [
  { label: "α", latex: "\\alpha" }, { label: "β", latex: "\\beta" }, { label: "γ", latex: "\\gamma" },
  { label: "δ", latex: "\\delta" }, { label: "ε", latex: "\\varepsilon" }, { label: "θ", latex: "\\theta" },
  { label: "λ", latex: "\\lambda" }, { label: "μ", latex: "\\mu" }, { label: "π", latex: "\\pi" },
  { label: "σ", latex: "\\sigma" }, { label: "φ", latex: "\\varphi" }, { label: "ω", latex: "\\omega" },
  { label: "∞", latex: "\\infty" }, { label: "≤", latex: "\\leq" }, { label: "≥", latex: "\\geq" },
  { label: "≠", latex: "\\neq" }, { label: "≈", latex: "\\approx" }, { label: "±", latex: "\\pm" },
  { label: "×", latex: "\\times" }, { label: "÷", latex: "\\div" },
  { label: "∈", latex: "\\in" }, { label: "⊂", latex: "\\subset" },
  { label: "∪", latex: "\\cup" }, { label: "∩", latex: "\\cap" },
  { label: "→", latex: "\\to" }, { label: "⟺", latex: "\\Leftrightarrow" },
];

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

// ── Component ─────────────────────────────────────────────────────────────────

interface TiptapEditorProps {
  content?: object;
  onChange?: (json: object) => void;
  editable?: boolean;
}

export default function TiptapEditor({ content, onChange, editable = true }: TiptapEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const imageInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const [showMath, setShowMath] = useState(false);
  const [mathInput, setMathInput] = useState("");
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: "Начните писать конспект..." }),
      CodeBlockLowlight.configure({ lowlight }),
      TabHandler, ImagePasteHandler,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle, Color, CustomImage, MathNode,
    ],
    content: content ?? { type: "doc", content: [] },
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => { onChangeRef.current?.(editor.getJSON()); },
  });

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
      if (editable) editor.commands.focus();
    }
  }, [editor, editable]);

  if (!editor) return null;

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => { editor!.chain().focus().setImage({ src: e.target?.result as string }).run(); };
    reader.readAsDataURL(file);
  }

  const currentColor = editor.getAttributes("textStyle").color as string | undefined;
  const imageAlign = editor.isActive("image") ? (editor.getAttributes("image").align as string) ?? "center" : null;

  // Unified toolbar button style
  const btnSx = (active: boolean) => ({
    width: 28, height: 28, borderRadius: 1,
    color: active ? (isDark ? "#0D0D0D" : "#FFFFFF") : "text.secondary",
    bgcolor: active ? "text.primary" : "transparent",
    "&:hover": { bgcolor: active ? "text.primary" : "action.hover" },
    transition: "background-color 0.15s, color 0.15s",
  });

  const sep = (
    <Box sx={{ width: "1px", height: 20, bgcolor: "divider", mx: 0.5, flexShrink: 0 }} />
  );

  return (
    <Box sx={{
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 2, overflow: "hidden",
      bgcolor: isDark ? "#1A1A1A" : "#FFFFFF",
    }}>
      {editable && (
        <Box sx={{
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.25,
          px: 1, py: 0.75,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? "#141414" : "#FAFAFA",
        }}>
          {/* Bold / Italic */}
          <Tooltip title="Жирный" placement="top"><IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} sx={btnSx(editor.isActive("bold"))}><FormatBoldIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
          <Tooltip title="Курсив" placement="top"><IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} sx={btnSx(editor.isActive("italic"))}><FormatItalicIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>

          {sep}

          {/* Headings */}
          {([1, 2, 3] as const).map(level => (
            <Tooltip key={level} title={`Заголовок ${level}`} placement="top">
              <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level }).run()} sx={{ ...btnSx(editor.isActive("heading", { level })), width: 32, fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>
                H{level}
              </IconButton>
            </Tooltip>
          ))}

          {sep}

          {/* Lists */}
          <Tooltip title="Список" placement="top"><IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} sx={btnSx(editor.isActive("bulletList"))}><FormatListBulletedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
          <Tooltip title="Нумерованный список" placement="top"><IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} sx={btnSx(editor.isActive("orderedList"))}><FormatListNumberedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>

          {sep}

          {/* Alignment */}
          <Tooltip title="По левому краю" placement="top"><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign("left").run()} sx={btnSx(editor.isActive({ textAlign: "left" }))}><FormatAlignLeftIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
          <Tooltip title="По центру" placement="top"><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign("center").run()} sx={btnSx(editor.isActive({ textAlign: "center" }))}><FormatAlignCenterIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
          <Tooltip title="По правому краю" placement="top"><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign("right").run()} sx={btnSx(editor.isActive({ textAlign: "right" }))}><FormatAlignRightIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>

          {sep}

          {/* Color picker */}
          <Tooltip title="Цвет текста" placement="top">
            <IconButton size="small" onClick={e => setColorAnchor(e.currentTarget)} sx={{ ...btnSx(!!currentColor), position: "relative" }}>
              <FormatColorTextIcon sx={{ fontSize: 16 }} />
              {currentColor && (
                <Box sx={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 12, height: 3, borderRadius: 0.5, bgcolor: currentColor }} />
              )}
            </IconButton>
          </Tooltip>
          <Popover open={!!colorAnchor} anchorEl={colorAnchor} onClose={() => setColorAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{ paper: { sx: { p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}` } } }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.75, mb: 1 }}>
              {COLORS.map(c => (
                <Box key={c} onClick={() => { editor.chain().focus().setColor(c).run(); setColorAnchor(null); }}
                  sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: c, cursor: "pointer", border: currentColor === c ? `2px solid ${theme.palette.text.primary}` : "2px solid transparent", "&:hover": { transform: "scale(1.15)" }, transition: "transform 0.1s" }} />
              ))}
            </Box>
            <Box onClick={() => { editor.chain().focus().unsetColor().run(); setColorAnchor(null); }}
              sx={{ fontSize: 12, color: "text.secondary", cursor: "pointer", textAlign: "center", "&:hover": { color: "text.primary" } }}>
              Сбросить цвет
            </Box>
          </Popover>

          {sep}

          {/* Code block */}
          <Tooltip title="Блок кода" placement="top"><IconButton size="small" onClick={() => editor.chain().focus().toggleCodeBlock().run()} sx={btnSx(editor.isActive("codeBlock"))}><CodeIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>

          {sep}

          {/* Image */}
          <Tooltip title="Вставить изображение" placement="top">
            <IconButton size="small" onClick={() => imageInputRef.current?.click()} sx={btnSx(false)}>
              <ImageIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />

          {/* Image alignment (shown when image selected) */}
          {imageAlign !== null && (
            <>
              {sep}
              {(["left", "center", "right"] as const).map(a => (
                <Tooltip key={a} title={a === "left" ? "Влево" : a === "center" ? "По центру" : "Вправо"} placement="top">
                  <IconButton size="small" onClick={() => editor.chain().focus().updateAttributes("image", { align: a }).run()} sx={btnSx(imageAlign === a)}>
                    {a === "left" ? <FormatAlignLeftIcon sx={{ fontSize: 16 }} /> : a === "center" ? <FormatAlignCenterIcon sx={{ fontSize: 16 }} /> : <FormatAlignRightIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              ))}
            </>
          )}

          {sep}

          {/* Math */}
          <Tooltip title="Математическая формула" placement="top">
            <IconButton size="small" onClick={() => { setShowMath(v => !v); setMathInput(""); }} sx={btnSx(showMath)}>
              <FunctionsIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Math panel */}
      {editable && showMath && (
        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, p: 2, bgcolor: isDark ? "#141414" : "#FAFAFA" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
            <Box>
              <Box sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>LaTeX</Box>
              <TextField
                autoFocus multiline rows={2} size="small" fullWidth
                placeholder="\frac{a}{b}"
                value={mathInput}
                onChange={e => setMathInput(e.target.value)}
                slotProps={{ input: { style: { fontFamily: "monospace", fontSize: 13 } } }}
              />
            </Box>
            <Box>
              <Box sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>Предпросмотр</Box>
              <MathPreview value={mathInput} />
            </Box>
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>Шаблоны</Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {MATH_TEMPLATES.map(t => (
                <Box key={t.label} onClick={() => setMathInput(v => v + t.latex)}
                  sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, px: 1.5, py: 0.5, fontSize: 12, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                  {t.label}
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>Символы</Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {MATH_SYMBOLS.map(s => (
                <Box key={s.latex} onClick={() => setMathInput(v => v + s.latex + " ")}
                  sx={{ width: 32, height: 32, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", "&:hover": { bgcolor: "action.hover" } }}>
                  {s.label}
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={false} onChange={() => {}} />}
              label={<Box component="span" sx={{ fontSize: 13 }}>Отдельной строкой</Box>}
            />
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="text" onClick={() => { setShowMath(false); setMathInput(""); }}>Отмена</Button>
            <Button size="small" variant="contained" disabled={!mathInput.trim()}
              onClick={() => {
                (editor!.chain().focus() as unknown as Record<string, (l: string, d: boolean) => { run: () => void }>)
                  .insertMath(mathInput.trim(), false).run();
                setShowMath(false); setMathInput("");
              }}>
              Вставить
            </Button>
          </Box>
        </Box>
      )}

      <EditorContent editor={editor} />
    </Box>
  );
}

function MathPreview({ value }: { value: string }) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (!value.trim()) { ref.current.innerHTML = ""; return; }
    try { katex.render(value, ref.current, { throwOnError: false, displayMode: false }); }
    catch { if (ref.current) ref.current.textContent = value; }
  }, [value]);
  return (
    <Box ref={ref} sx={{
      minHeight: 68, border: `1px solid ${theme.palette.divider}`, borderRadius: 1,
      px: 1.5, py: 1, display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "auto", fontSize: 14,
    }} />
  );
}
