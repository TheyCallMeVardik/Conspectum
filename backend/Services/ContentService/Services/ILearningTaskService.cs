using ContentService.DTOs;

namespace ContentService.Services;

public interface ILearningTaskService
{
    Task<IReadOnlyList<LearningTaskDto>> GetAllAsync(Guid userId, CancellationToken ct = default);
    Task<LearningTaskDto> GetByIdAsync(Guid userId, Guid taskId, CancellationToken ct = default);
    Task<LearningTaskDto> CreateAsync(Guid userId, CreateLearningTaskRequest request, CancellationToken ct = default);
    Task<LearningTaskDto> UpdateAsync(Guid userId, Guid taskId, UpdateLearningTaskRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid taskId, CancellationToken ct = default);
}
