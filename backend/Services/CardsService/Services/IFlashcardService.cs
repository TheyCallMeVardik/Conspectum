using CardsService.DTOs;

namespace CardsService.Services;

/// <summary>
/// Business logic for flashcard CRUD and SM-2 review sessions.
/// </summary>
public interface IFlashcardService
{
    /// <summary>Returns all flashcards for the authenticated user, optionally filtered by deck.</summary>
    Task<IReadOnlyList<FlashcardDto>> GetAllAsync(Guid userId, Guid? deckId = null, CancellationToken ct = default);

    /// <summary>Returns all cards currently due for review, optionally filtered by deck.</summary>
    Task<ReviewSessionSummaryDto> GetDueAsync(Guid userId, Guid? deckId = null, CancellationToken ct = default);

    /// <summary>Returns a single card by id.</summary>
    Task<FlashcardDto> GetByIdAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    /// <summary>Creates a new flashcard.</summary>
    Task<FlashcardDto> CreateAsync(Guid userId, CreateFlashcardRequest request, CancellationToken ct = default);

    /// <summary>Updates the front and back text of an existing card.</summary>
    Task<FlashcardDto> UpdateAsync(Guid userId, Guid cardId, UpdateFlashcardRequest request, CancellationToken ct = default);

    /// <summary>Deletes a flashcard.</summary>
    Task DeleteAsync(Guid userId, Guid cardId, CancellationToken ct = default);

    /// <summary>
    /// Applies SM-2 algorithm to reschedule a card based on the review quality.
    /// Returns the updated card.
    /// </summary>
    Task<FlashcardDto> ReviewAsync(Guid userId, Guid cardId, ReviewRequest request, CancellationToken ct = default);
}
