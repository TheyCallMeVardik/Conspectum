using ContentService.DTOs;

namespace ContentService.Services;

/// <summary>
/// Business logic for quiz (тест) CRUD.
/// </summary>
public interface IQuizService
{
    /// <summary>Returns all quiz summaries for the authenticated user, optionally filtered by search query.</summary>
    Task<IReadOnlyList<QuizSummaryDto>> GetAllAsync(Guid userId, string? search = null, CancellationToken ct = default);

    /// <summary>Returns full quiz with questions and answers. Throws <see cref="KeyNotFoundException"/> if not found or not owned.</summary>
    Task<QuizDetailDto> GetByIdAsync(Guid userId, Guid quizId, CancellationToken ct = default);

    /// <summary>Creates a quiz with its questions and answers.</summary>
    Task<QuizDetailDto> CreateAsync(Guid userId, CreateQuizRequest request, CancellationToken ct = default);

    /// <summary>Deletes a quiz. Throws <see cref="KeyNotFoundException"/> or <see cref="UnauthorizedAccessException"/>.</summary>
    Task DeleteAsync(Guid userId, Guid quizId, CancellationToken ct = default);
}
