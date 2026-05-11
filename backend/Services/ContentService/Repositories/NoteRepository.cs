using ContentService.Data;
using ContentService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContentService.Repositories;

/// <summary>
/// EF Core implementation of <see cref="INoteRepository"/>.
/// </summary>
public sealed class NoteRepository(ContentDbContext db) : INoteRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<Note>> GetByUserAsync(Guid userId, CancellationToken ct = default) =>
        await db.Notes
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.UpdatedAt)
                .ToListAsync(ct);

    /// <inheritdoc />
    public Task<Note?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Notes.FindAsync([id], ct).AsTask();

    /// <inheritdoc />
    public async Task AddAsync(Note note, CancellationToken ct = default) =>
        await db.Notes.AddAsync(note, ct);

    /// <inheritdoc />
    public void Remove(Note note) => db.Notes.Remove(note);

    /// <inheritdoc />
    public void MarkContentModified(Note note) =>
        db.Entry(note).Property(n => n.ContentJson).IsModified = true;

    /// <inheritdoc />
    public Task SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
