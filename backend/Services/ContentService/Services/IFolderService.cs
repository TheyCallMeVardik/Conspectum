using ContentService.DTOs;

namespace ContentService.Services;

public interface IFolderService
{
    Task<IReadOnlyList<FolderDto>> GetAllAsync(Guid userId, CancellationToken ct = default);
    Task<FolderDto> CreateAsync(Guid userId, CreateFolderRequest request, CancellationToken ct = default);
    Task<FolderDto> RenameAsync(Guid userId, Guid folderId, RenameFolderRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid folderId, CancellationToken ct = default);
}
