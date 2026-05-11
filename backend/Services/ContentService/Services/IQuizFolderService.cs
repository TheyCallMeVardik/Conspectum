using ContentService.DTOs;

namespace ContentService.Services;

public interface IQuizFolderService
{
    Task<IReadOnlyList<QuizFolderDto>> GetAllAsync(Guid userId, CancellationToken ct = default);
    Task<QuizFolderDto> CreateAsync(Guid userId, UpsertQuizFolderRequest request, CancellationToken ct = default);
    Task<QuizFolderDto> RenameAsync(Guid userId, Guid folderId, UpsertQuizFolderRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid folderId, CancellationToken ct = default);
}
