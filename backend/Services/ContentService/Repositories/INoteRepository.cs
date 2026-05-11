using ContentService.Entities;

namespace ContentService.Repositories;

/// <summary>
/// Abstraction over note persistence.
/// </summary>
public interface INoteRepository
{
    /// <summary>Returns all notes belonging to the specified user, newest first.</summary>
    Task<IReadOnlyList<Note>> GetByUserAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Finds a note by id. Returns <c>null</c> if not found.</summary>
    Task<Note?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Persists a new note.</summary>
    Task AddAsync(Note note, CancellationToken ct = default);

    /// <summary>Removes a note from the database.</summary>
    void Remove(Note note);

    /// <summary>
    /// Explicitly marks <see cref="Note.ContentJson"/> as modified so EF Core
    /// includes it in the UPDATE statement (JsonDocument is not auto-tracked).
    /// </summary>
    void MarkContentModified(Note note);

    /// <summary>Commits pending changes.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
