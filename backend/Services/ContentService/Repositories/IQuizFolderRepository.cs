using ContentService.Entities;

namespace ContentService.Repositories;

public interface IQuizFolderRepository
{
    Task<IReadOnlyList<QuizFolder>> GetByUserAsync(Guid userId, CancellationToken ct = default);
    Task<QuizFolder?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(QuizFolder folder, CancellationToken ct = default);
    void Remove(QuizFolder folder);
    Task SaveChangesAsync(CancellationToken ct = default);
}
