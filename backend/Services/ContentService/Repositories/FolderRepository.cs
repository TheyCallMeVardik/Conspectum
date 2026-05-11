using ContentService.Data;
using ContentService.DTOs;
using ContentService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContentService.Repositories;

public sealed class FolderRepository(ContentDbContext db) : IFolderRepository
{
    public async Task<IReadOnlyList<FolderDto>> GetByUserAsync(Guid userId, CancellationToken ct = default) =>
        await db.NoteFolders
                .Where(f => f.UserId == userId)
                .OrderBy(f => f.Name)
                .Select(f => new FolderDto(f.Id, f.Name, f.Description, f.CreatedAt, f.Notes.Count()))
                .ToListAsync(ct);

    public Task<NoteFolder?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.NoteFolders.FindAsync([id], ct).AsTask();

    public async Task AddAsync(NoteFolder folder, CancellationToken ct = default) =>
        await db.NoteFolders.AddAsync(folder, ct);

    public void Remove(NoteFolder folder) => db.NoteFolders.Remove(folder);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
