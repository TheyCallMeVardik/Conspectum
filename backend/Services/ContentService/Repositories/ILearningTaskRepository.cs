using ContentService.Entities;

namespace ContentService.Repositories;

public interface ILearningTaskRepository
{
    Task<IReadOnlyList<LearningTask>> GetByUserAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<LearningTask>> GetUpcomingDeadlinesAsync(int hoursAhead, CancellationToken ct = default);
    Task<LearningTask?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(LearningTask task, CancellationToken ct = default);
    void Remove(LearningTask task);
    void MarkDescriptionModified(LearningTask task);
    Task SaveChangesAsync(CancellationToken ct = default);
}
