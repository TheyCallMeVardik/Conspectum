using ContentService.DTOs;
using ContentService.Entities;
using ContentService.Repositories;

namespace ContentService.Services;

public sealed class FolderService(IFolderRepository folderRepo) : IFolderService
{
    public async Task<IReadOnlyList<FolderDto>> GetAllAsync(Guid userId, CancellationToken ct = default) =>
        await folderRepo.GetByUserAsync(userId, ct);

    public async Task<FolderDto> CreateAsync(Guid userId, CreateFolderRequest request, CancellationToken ct = default)
    {
        var folder = new NoteFolder
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
        };
        await folderRepo.AddAsync(folder, ct);
        await folderRepo.SaveChangesAsync(ct);
        return new FolderDto(folder.Id, folder.Name, folder.Description, folder.CreatedAt, 0);
    }

    public async Task<FolderDto> RenameAsync(Guid userId, Guid folderId, RenameFolderRequest request, CancellationToken ct = default)
    {
        var folder = await FindAndAuthorize(userId, folderId, ct);
        folder.Name = request.Name.Trim();
        folder.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        await folderRepo.SaveChangesAsync(ct);
        return new FolderDto(folder.Id, folder.Name, folder.Description, folder.CreatedAt, 0);
    }

    public async Task DeleteAsync(Guid userId, Guid folderId, CancellationToken ct = default)
    {
        var folder = await FindAndAuthorize(userId, folderId, ct);
        folderRepo.Remove(folder);
        await folderRepo.SaveChangesAsync(ct);
    }

    private async Task<NoteFolder> FindAndAuthorize(Guid userId, Guid folderId, CancellationToken ct)
    {
        var folder = await folderRepo.GetByIdAsync(folderId, ct)
            ?? throw new KeyNotFoundException($"Folder {folderId} not found.");
        if (folder.UserId != userId)
            throw new UnauthorizedAccessException("Access denied.");
        return folder;
    }
}
