using ContentService.DTOs;
using ContentService.Entities;

namespace ContentService.Repositories;

public interface IFolderRepository
{
    Task<IReadOnlyList<FolderDto>> GetByUserAsync(Guid userId, CancellationToken ct = default);
    Task<NoteFolder?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(NoteFolder folder, CancellationToken ct = default);
    void Remove(NoteFolder folder);
    Task SaveChangesAsync(CancellationToken ct = default);
}
