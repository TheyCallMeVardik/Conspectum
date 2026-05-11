using ContentService.DTOs;
using ContentService.Entities;
using ContentService.Repositories;

namespace ContentService.Services;

public sealed class QuizFolderService(IQuizFolderRepository repo) : IQuizFolderService
{
    public async Task<IReadOnlyList<QuizFolderDto>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        var folders = await repo.GetByUserAsync(userId, ct);
        return folders.Select(ToDto).ToList();
    }

    public async Task<QuizFolderDto> CreateAsync(Guid userId, UpsertQuizFolderRequest request, CancellationToken ct = default)
    {
        var folder = new QuizFolder { UserId = userId, Name = request.Name.Trim(), Description = request.Description?.Trim() };
        await repo.AddAsync(folder, ct);
        await repo.SaveChangesAsync(ct);
        return ToDto(folder);
    }

    public async Task<QuizFolderDto> RenameAsync(Guid userId, Guid folderId, UpsertQuizFolderRequest request, CancellationToken ct = default)
    {
        var folder = await repo.GetByIdAsync(folderId, ct)
            ?? throw new KeyNotFoundException($"Folder {folderId} not found.");
        if (folder.UserId != userId) throw new UnauthorizedAccessException();
        folder.Name = request.Name.Trim();
        folder.Description = request.Description?.Trim();
        await repo.SaveChangesAsync(ct);
        return ToDto(folder);
    }

    public async Task DeleteAsync(Guid userId, Guid folderId, CancellationToken ct = default)
    {
        var folder = await repo.GetByIdAsync(folderId, ct)
            ?? throw new KeyNotFoundException($"Folder {folderId} not found.");
        if (folder.UserId != userId) throw new UnauthorizedAccessException();
        repo.Remove(folder);
        await repo.SaveChangesAsync(ct);
    }

    private static QuizFolderDto ToDto(QuizFolder f) =>
        new(f.Id, f.Name, f.Description, f.Quizzes.Count);
}
