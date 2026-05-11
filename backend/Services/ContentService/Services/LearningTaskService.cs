using System.Text.Json;
using ContentService.DTOs;
using ContentService.Entities;
using ContentService.Repositories;

namespace ContentService.Services;

public sealed class LearningTaskService(ILearningTaskRepository repo) : ILearningTaskService
{
    public async Task<IReadOnlyList<LearningTaskDto>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        var tasks = await repo.GetByUserAsync(userId, ct);
        return tasks.Select(ToDto).ToList();
    }

    public async Task<LearningTaskDto> GetByIdAsync(Guid userId, Guid taskId, CancellationToken ct = default)
    {
        var task = await FindAndAuthorize(userId, taskId, ct);
        return ToDto(task);
    }

    public async Task<LearningTaskDto> CreateAsync(Guid userId, CreateLearningTaskRequest request, CancellationToken ct = default)
    {
        var task = new LearningTask
        {
            UserId = userId,
            Title = request.Title,
            DescriptionJson = request.DescriptionJson.HasValue
                ? JsonDocument.Parse(request.DescriptionJson.Value.GetRawText())
                : null,
            Status = request.Status,
            Deadline = request.Deadline,
            MaterialType = request.MaterialType,
            MaterialId = request.MaterialId,
            MaterialTitle = request.MaterialTitle,
        };

        await repo.AddAsync(task, ct);
        await repo.SaveChangesAsync(ct);
        return ToDto(task);
    }

    public async Task<LearningTaskDto> UpdateAsync(Guid userId, Guid taskId, UpdateLearningTaskRequest request, CancellationToken ct = default)
    {
        var task = await FindAndAuthorize(userId, taskId, ct);

        task.Title = request.Title;
        task.DescriptionJson = request.DescriptionJson.HasValue
            ? JsonDocument.Parse(request.DescriptionJson.Value.GetRawText())
            : null;
        task.Status = request.Status;
        task.Deadline = request.Deadline;
        task.MaterialType = request.MaterialType;
        task.MaterialId = request.MaterialId;
        task.MaterialTitle = request.MaterialTitle;
        task.UpdatedAt = DateTime.UtcNow;
        repo.MarkDescriptionModified(task);

        await repo.SaveChangesAsync(ct);
        return ToDto(task);
    }

    public async Task DeleteAsync(Guid userId, Guid taskId, CancellationToken ct = default)
    {
        var task = await FindAndAuthorize(userId, taskId, ct);
        repo.Remove(task);
        await repo.SaveChangesAsync(ct);
    }

    private async Task<LearningTask> FindAndAuthorize(Guid userId, Guid taskId, CancellationToken ct)
    {
        var task = await repo.GetByIdAsync(taskId, ct)
            ?? throw new KeyNotFoundException($"Task {taskId} not found.");
        if (task.UserId != userId)
            throw new UnauthorizedAccessException("Access denied.");
        return task;
    }

    private static LearningTaskDto ToDto(LearningTask t) => new(
        t.Id, t.Title,
        t.DescriptionJson?.RootElement.Clone(),
        t.Status, t.Deadline,
        t.MaterialType, t.MaterialId, t.MaterialTitle,
        t.CreatedAt, t.UpdatedAt);
}
