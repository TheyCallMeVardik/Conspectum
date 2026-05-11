"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Button, TextField, IconButton, List, ListItem,
  ListItemButton, ListItemText, ListItemIcon, Divider, Card, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Chip, alpha, Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import ArticleIcon from "@mui/icons-material/Article";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import { getNotes, createNote, deleteNote, searchNotes, NoteSummary } from "@/lib/notes";
import { getFolders, createFolder, deleteFolder, renameFolder, Folder } from "@/lib/folders";

export default function NotesPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDesc, setFolderDesc] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", search],
    queryFn: () => search.trim() ? searchNotes(search) : getNotes(),
  });
  const { data: folders = [] } = useQuery({ queryKey: ["folders"], queryFn: getFolders });

  const createNoteMutation = useMutation({
    mutationFn: () => createNote(newTitle, { type: "doc", content: [] }, selectedFolder !== "all" ? selectedFolder : null),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); setNewTitle(""); setShowCreate(false); },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const createFolderMutation = useMutation({
    mutationFn: () => createFolder(folderName.trim(), folderDesc.trim()),
    onSuccess: (f) => { queryClient.invalidateQueries({ queryKey: ["folders"] }); setShowFolderDialog(false); setFolderName(""); setFolderDesc(""); setSelectedFolder(f.id); },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["folders"] }); if (selectedFolder === id) setSelectedFolder("all"); },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name, desc }: { id: string; name: string; desc: string }) => renameFolder(id, name, desc),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["folders"] }); setRenamingFolder(null); },
  });

  const filteredNotes = (notes as NoteSummary[]).filter(n =>
    search.trim() ? true : selectedFolder === "all" ? true : n.folderId === selectedFolder
  );

  const activeFolder = (folders as Folder[]).find(f => f.id === selectedFolder);
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ display: "flex", gap: 3, maxWidth: 1100, mx: "auto" }}>
      {/* Folder sidebar */}
      <Box sx={{ width: 200, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", px: 1, display: "block", mb: 1 }}>
          Папки
        </Typography>
        <List dense disablePadding>
          <ListItem disablePadding>
            <ListItemButton selected={selectedFolder === "all"} onClick={() => setSelectedFolder("all")} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}><ArticleIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Все конспекты" slotProps={{ primary: { style: { fontSize: 14 } } }} />
              <Typography variant="caption" color="text.secondary">{(notes as any[]).length}</Typography>
            </ListItemButton>
          </ListItem>
        </List>

        {(folders as Folder[]).length > 0 && <Divider sx={{ my: 1 }} />}

        <List dense disablePadding>
          {(folders as Folder[]).map(folder => (
            <ListItem key={folder.id} disablePadding
              secondaryAction={
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Переименовать">
                    <IconButton size="small" onClick={() => setRenamingFolder(folder)} sx={{ p: 0.5 }}>
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton size="small" onClick={() => deleteFolderMutation.mutate(folder.id)} sx={{ p: 0.5, color: "error.main" }}>
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemButton selected={selectedFolder === folder.id} onClick={() => setSelectedFolder(folder.id)} sx={{ borderRadius: 2, mb: 0.5, pr: 7 }}>
                <ListItemIcon sx={{ minWidth: 32 }}><FolderIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={folder.name} slotProps={{ primary: { style: { fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } } }} />
                <Typography variant="caption" color="text.secondary">{folder.noteCount}</Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 1 }} />
        <Button size="small" startIcon={<AddIcon />} onClick={() => setShowFolderDialog(true)} sx={{ width: "100%", justifyContent: "flex-start", px: 1 }}>
          Создать папку
        </Button>
      </Box>

      {/* Notes area */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              {selectedFolder === "all" ? "Конспекты" : (activeFolder?.name ?? "Конспекты")}
            </Typography>
            {activeFolder?.description && (
              <Typography variant="body2" color="text.secondary">{activeFolder.description}</Typography>
            )}
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreate(true)}>
            Новый конспект
          </Button>
        </Box>

        <TextField
          size="small" placeholder="Поиск по конспектам..." value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 1, color: "text.disabled", fontSize: 20 }} /> } }}
          sx={{ mb: 2, maxWidth: 320 }}
        />

        {showCreate && (
          <Card sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.primary.main}` }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Название нового конспекта</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField size="small" autoFocus fullWidth placeholder="Например: Введение в алгоритмы"
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && newTitle.trim() && createNoteMutation.mutate()} />
              <Button variant="contained" disabled={!newTitle.trim()} onClick={() => createNoteMutation.mutate()}>
                Создать
              </Button>
              <Button variant="outlined" onClick={() => setShowCreate(false)}>Отмена</Button>
            </Box>
          </Card>
        )}

        {filteredNotes.length === 0 ? (
          <Card sx={{ p: 6, textAlign: "center", border: `1px dashed ${theme.palette.divider}` }}>
            <ArticleIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {search ? "Ничего не найдено" : "Конспектов пока нет"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {search ? "Попробуйте изменить запрос" : "Создайте первый конспект"}
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {filteredNotes.map(note => {
              const folder = (folders as Folder[]).find(f => f.id === note.folderId);
              return (
                <Card key={note.id} sx={{
                  "&:hover": { borderColor: "primary.main" }, transition: "border-color 0.15s",
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", p: 2, gap: 2 }}>
                    <Box component={Link} href={`/dashboard/notes/${note.id}`} sx={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, "&:hover": { color: "primary.main" }, transition: "color 0.15s" }}>
                        {note.title}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        {folder && <Chip label={folder.name} size="small" icon={<FolderIcon />} sx={{ height: 20, fontSize: 11 }} />}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(note.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Редактировать">
                        <IconButton size="small" component={Link} href={`/dashboard/notes/${note.id}?edit=1`}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton size="small" onClick={() => deleteNoteMutation.mutate(note.id)} sx={{ color: "error.main" }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Create folder dialog */}
      <Dialog open={showFolderDialog} onClose={() => setShowFolderDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Новая папка</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {createFolderMutation.isError && <Alert severity="error">Ошибка создания папки</Alert>}
            <TextField label="Название" size="small" autoFocus value={folderName} onChange={e => setFolderName(e.target.value)} />
            <TextField label="Описание (необязательно)" size="small" value={folderDesc} onChange={e => setFolderDesc(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowFolderDialog(false); setFolderName(""); setFolderDesc(""); }}>Отмена</Button>
          <Button variant="contained" disabled={!folderName.trim()} onClick={() => createFolderMutation.mutate()}>Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={!!renamingFolder} onClose={() => setRenamingFolder(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Переименовать папку</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Название" size="small" autoFocus
              value={renamingFolder?.name ?? ""}
              onChange={e => setRenamingFolder(f => f ? { ...f, name: e.target.value } : null)} />
            <TextField label="Описание" size="small"
              value={renamingFolder?.description ?? ""}
              onChange={e => setRenamingFolder(f => f ? { ...f, description: e.target.value } : null)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenamingFolder(null)}>Отмена</Button>
          <Button variant="contained"
            disabled={!renamingFolder?.name.trim()}
            onClick={() => renamingFolder && renameFolderMutation.mutate({ id: renamingFolder.id, name: renamingFolder.name, desc: renamingFolder.description ?? "" })}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

