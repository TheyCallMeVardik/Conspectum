namespace CardsService.DTOs;

/// <summary>Payload for creating a new flashcard.</summary>
public sealed record CreateFlashcardRequest(string Front, string Back, Guid? DeckId = null);

/// <summary>Payload for updating an existing flashcard's content.</summary>
public sealed record UpdateFlashcardRequest(string Front, string Back);

/// <summary>
/// Payload for submitting a review result.
/// Quality must be between 0 (complete blackout) and 5 (perfect recall).
/// </summary>
public sealed record ReviewRequest(int Quality);

/// <summary>Full flashcard detail returned in responses.</summary>
public sealed record FlashcardDto(
    Guid Id,
    string Front,
    string Back,
    int Interval,
    int Repetitions,
    double EaseFactor,
    DateTime NextReview,
    DateTime CreatedAt,
    Guid? DeckId);

/// <summary>Summary for the review session – how many cards are due.</summary>
public sealed record ReviewSessionSummaryDto(int DueCount, IReadOnlyList<FlashcardDto> DueCards);
