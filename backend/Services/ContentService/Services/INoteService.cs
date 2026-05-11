using ContentService.DTOs;

namespace ContentService.Services;

/// <summary>
/// Business logic for note CRUD and search.
/// </summary>
public interface INoteService
{
    /// <summary>Returns all note summaries for the authenticated user.</summary>
    Task<IReadOnlyList<NoteSummaryDto>> GetAllAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Returns the full note detail. Throws <see cref="KeyNotFoundException"/> if not found or not owned.</summary>
    Task<NoteDetailDto> GetByIdAsync(Guid userId, Guid noteId, CancellationToken ct = default);

    /// <summary>Creates a note, persists it, and indexes it in Elasticsearch.</summary>
    Task<NoteDetailDto> CreateAsync(Guid userId, UpsertNoteRequest request, CancellationToken ct = default);

    /// <summary>Updates a note and re-indexes it. Throws <see cref="KeyNotFoundException"/> or <see cref="UnauthorizedAccessException"/>.</summary>
    Task<NoteDetailDto> UpdateAsync(Guid userId, Guid noteId, UpsertNoteRequest request, CancellationToken ct = default);

    /// <summary>Deletes a note and removes it from the index. Throws <see cref="KeyNotFoundException"/> or <see cref="UnauthorizedAccessException"/>.</summary>
    Task DeleteAsync(Guid userId, Guid noteId, CancellationToken ct = default);

    /// <summary>Full-text search over the user's notes using Elasticsearch.</summary>
    Task<IReadOnlyList<NoteSummaryDto>> SearchAsync(Guid userId, string query, CancellationToken ct = default);
}
