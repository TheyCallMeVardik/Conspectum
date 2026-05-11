"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  Chip, CircularProgress, FormControl, InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import FolderIcon from "@mui/icons-material/Folder";
import CheckIcon from "@mui/icons-material/Check";
import { getNote, updateNote } from "@/lib/notes";
import { getFolders, Folder } from "@/lib/folders";
import TiptapEditor from "@/components/TiptapEditor";

// use(params) must be inside Suspense — split into inner component
function NotePageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <NotePageContent id={id} />;
}

function NotePageContent({ id }: { id: string }) {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = searchParams.get("edit") === "1";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<object | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["note", id], queryFn: () => getNote(id) });
  const { data: folders = [] } = useQuery({ queryKey: ["folders"], queryFn: getFolders });

  useEffect(() => {
    if (data) { setTitle(data.title); setContent(data.contentJson); setFolderId(data.folderId ?? null); }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updateNote(id, title, content ?? { type: "doc", content: [] }, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleContentChange = useCallback((json: object) => { setContent(json); setSaved(false); }, []);

  if (isLoading || content === null) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}><CircularProgress size={24} /></Box>;
  }

  const currentFolder = (folders as Folder[]).find(f => f.id === folderId);
  const isDark = theme.palette.mode === "dark";
  const editorBg = isDark ? "#1E1E1E" : "#FFFFFF";
  const borderColor = theme.palette.divider;

  if (!isEditing) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Button component={Link} href="/dashboard/notes" variant="outlined" startIcon={<ArrowBackIcon />} size="small">
            Назад
          </Button>
          <Button variant="outlined" startIcon={<EditIcon />} size="small"
            onClick={() => router.push(`/dashboard/notes/${id}?edit=1`)}>
            Редактировать
          </Button>
        </Box>
        {currentFolder && <Chip icon={<FolderIcon />} label={currentFolder.name} size="small" sx={{ mb: 2 }} />}
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.02em", mb: 3 }}>{title}</Typography>
        <Box sx={{ bgcolor: editorBg, borderRadius: 2, p: 2 }}>
          <TiptapEditor content={content} editable={false} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Button component={Link} href={`/dashboard/notes/${id}`} variant="outlined" startIcon={<ArrowBackIcon />} size="small">
          Просмотр
        </Button>
        <Button variant="contained" startIcon={saved ? <CheckIcon /> : undefined}
          onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saved ? "Сохранено" : saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <TextField
          variant="standard" fullWidth placeholder="Название конспекта"
          value={title} onChange={e => setTitle(e.target.value)}
          slotProps={{ input: { style: { fontSize: 24, fontWeight: 700 } } }}
          sx={{
            "& .MuiInput-underline:before": { borderBottom: "none" },
            "& .MuiInput-underline:after": { borderBottomColor: "text.primary" },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160, flexShrink: 0 }}>
          <InputLabel>Папка</InputLabel>
          <Select value={folderId ?? ""} label="Папка" onChange={e => setFolderId(e.target.value || null)}>
            <MenuItem value=""><em>Без папки</em></MenuItem>
            {(folders as Folder[]).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Editor with explicit styling since Tailwind is removed */}
      <Box sx={{
        border: `1px solid ${borderColor}`, borderRadius: 2, overflow: "hidden",
        bgcolor: editorBg, minHeight: 500,
        "& .ProseMirror": { padding: "16px", minHeight: "460px", outline: "none" },
      }}>
        <TiptapEditor content={content} onChange={handleContentChange} />
      </Box>
    </Box>
  );
}

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", p: 6 }}><CircularProgress size={24} /></Box>}>
      <NotePageInner params={params} />
    </Suspense>
  );
}
