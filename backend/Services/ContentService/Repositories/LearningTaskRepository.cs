using ContentService.Data;
using ContentService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContentService.Repositories;

public sealed class LearningTaskRepository(ContentDbContext db) : ILearningTaskRepository
{
    public async Task<IReadOnlyList<LearningTask>> GetByUserAsync(Guid userId, CancellationToken ct = default) =>
        await db.LearningTasks
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.Deadline.HasValue ? 0 : 1)
                .ThenBy(t => t.Deadline)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync(ct);

    public async Task<IReadOnlyList<LearningTask>> GetUpcomingDeadlinesAsync(
        int hoursAhead, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddHours(hoursAhead);
        return await db.LearningTasks
            .Where(t => t.Deadline.HasValue
                     && t.Deadline.Value <= cutoff
                     && t.Deadline.Value >= DateTime.UtcNow
                     && t.Status != LearningTaskStatus.Done)
            .OrderBy(t => t.Deadline)
            .ToListAsync(ct);
    }

    public Task<LearningTask?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.LearningTasks.FindAsync([id], ct).AsTask();

    public async Task AddAsync(LearningTask task, CancellationToken ct = default) =>
        await db.LearningTasks.AddAsync(task, ct);

    public void Remove(LearningTask task) => db.LearningTasks.Remove(task);

    public void MarkDescriptionModified(LearningTask task)
    {
        if (task.DescriptionJson is not null)
            db.Entry(task).Property(t => t.DescriptionJson).IsModified = true;
    }

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
