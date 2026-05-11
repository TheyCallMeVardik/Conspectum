using ContentService.Entities;

namespace ContentService.Repositories;

/// <summary>
/// Abstraction over quiz persistence.
/// </summary>
public interface IQuizRepository
{
    /// <summary>Returns all quizzes belonging to the specified user, newest first. Optionally filtered by search query.</summary>
    Task<IReadOnlyList<Quiz>> GetByUserAsync(Guid userId, string? search = null, CancellationToken ct = default);

    /// <summary>Finds a quiz with all questions and answers. Returns <c>null</c> if not found.</summary>
    Task<Quiz?> GetByIdWithQuestionsAsync(Guid id, CancellationToken ct = default);

    /// <summary>Persists a new quiz.</summary>
    Task AddAsync(Quiz quiz, CancellationToken ct = default);

    /// <summary>Removes a quiz from the database.</summary>
    void Remove(Quiz quiz);

    /// <summary>Commits pending changes.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
