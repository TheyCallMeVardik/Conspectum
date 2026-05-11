using System.Text;
using System.Text.Json;
using ContentService.DTOs;
using ContentService.Entities;
using ContentService.Repositories;
using ContentService.Search;

namespace ContentService.Services;

/// <summary>
/// Concrete implementation of <see cref="INoteService"/>.
/// </summary>
public sealed class NoteService(
    INoteRepository noteRepo,
    ISearchService searchService) : INoteService
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<NoteSummaryDto>> GetAllAsync(
        Guid userId, CancellationToken ct = default)
    {
        var notes = await noteRepo.GetByUserAsync(userId, ct);
        return notes.Select(ToSummary).ToList();
    }

    /// <inheritdoc />
    public async Task<NoteDetailDto> GetByIdAsync(
        Guid userId, Guid noteId, CancellationToken ct = default)
    {
        var note = await FindAndAuthorize(userId, noteId, ct);
        return ToDetail(note);
    }

    /// <inheritdoc />
    public async Task<NoteDetailDto> CreateAsync(
        Guid userId, UpsertNoteRequest request, CancellationToken ct = default)
    {
        var note = new Note
        {
            UserId = userId,
            Title = request.Title,
            ContentJson = JsonDocument.Parse(request.ContentJson.GetRawText()),
            FolderId = request.FolderId,
        };

        await noteRepo.AddAsync(note, ct);
        await noteRepo.SaveChangesAsync(ct);
        await searchService.IndexNoteAsync(ToSearchDoc(note), ct);

        return ToDetail(note);
    }

    /// <inheritdoc />
    public async Task<NoteDetailDto> UpdateAsync(
        Guid userId, Guid noteId, UpsertNoteRequest request, CancellationToken ct = default)
    {
        var note = await FindAndAuthorize(userId, noteId, ct);

        note.Title = request.Title;
        note.ContentJson = JsonDocument.Parse(request.ContentJson.GetRawText());
        note.FolderId = request.FolderId;
        note.UpdatedAt = DateTime.UtcNow;
        noteRepo.MarkContentModified(note);

        await noteRepo.SaveChangesAsync(ct);
        await searchService.IndexNoteAsync(ToSearchDoc(note), ct);

        return ToDetail(note);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(Guid userId, Guid noteId, CancellationToken ct = default)
    {
        var note = await FindAndAuthorize(userId, noteId, ct);
        noteRepo.Remove(note);
        await noteRepo.SaveChangesAsync(ct);
        await searchService.DeleteNoteAsync(noteId, ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<NoteSummaryDto>> SearchAsync(
        Guid userId, string query, CancellationToken ct = default)
    {
        var docs = await searchService.SearchAsync(userId, query, ct);
        return docs.Select(d => new NoteSummaryDto(d.Id, d.Title, null, d.CreatedAt, d.UpdatedAt))
                   .ToList();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private async Task<Note> FindAndAuthorize(Guid userId, Guid noteId, CancellationToken ct)
    {
        var note = await noteRepo.GetByIdAsync(noteId, ct)
            ?? throw new KeyNotFoundException($"Note {noteId} not found.");
        if (note.UserId != userId)
            throw new UnauthorizedAccessException("Access denied.");
        return note;
    }

    private static NoteSummaryDto ToSummary(Note n) =>
        new(n.Id, n.Title, n.FolderId, n.CreatedAt, n.UpdatedAt);

    private static NoteDetailDto ToDetail(Note n) =>
        new(n.Id, n.Title, n.FolderId, n.ContentJson.RootElement.Clone(), n.CreatedAt, n.UpdatedAt);

    /// <summary>
    /// Extracts plain text from a ProseMirror/Tiptap JSON document by recursively
    /// collecting all "text" node values.
    /// </summary>
    private static string ExtractPlainText(JsonDocument doc)
    {
        var sb = new StringBuilder();
        ExtractText(doc.RootElement, sb);
        return sb.ToString();
    }

    private static void ExtractText(JsonElement element, StringBuilder sb)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            if (element.TryGetProperty("type", out var typeEl) &&
                typeEl.GetString() == "text" &&
                element.TryGetProperty("text", out var textEl))
            {
                sb.Append(textEl.GetString()).Append(' ');
            }
            if (element.TryGetProperty("content", out var contentEl))
                ExtractText(contentEl, sb);
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in element.EnumerateArray())
                ExtractText(child, sb);
        }
    }

    private NoteSearchDocument ToSearchDoc(Note n) => new()
    {
        Id = n.Id,
        UserId = n.UserId,
        Title = n.Title,
        PlainText = ExtractPlainText(n.ContentJson),
        CreatedAt = n.CreatedAt,
        UpdatedAt = n.UpdatedAt,
    };
}
