using CardsService.Entities;

namespace CardsService.Repositories;

/// <summary>
/// Abstraction over flashcard persistence.
/// </summary>
public interface IFlashcardRepository
{
    /// <summary>Returns all flashcards for the specified user, optionally filtered by deck.</summary>
    Task<IReadOnlyList<Flashcard>> GetByUserAsync(Guid userId, Guid? deckId = null, CancellationToken ct = default);

    /// <summary>Returns cards due for review (NextReview &lt;= now) for the user, optionally filtered by deck.</summary>
    Task<IReadOnlyList<Flashcard>> GetDueAsync(Guid userId, Guid? deckId = null, CancellationToken ct = default);

    /// <summary>Finds a card by id. Returns <c>null</c> if not found.</summary>
    Task<Flashcard?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Persists a new flashcard.</summary>
    Task AddAsync(Flashcard card, CancellationToken ct = default);

    /// <summary>Removes a flashcard.</summary>
    void Remove(Flashcard card);

    /// <summary>Commits pending changes.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
