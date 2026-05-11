namespace CardsService.DTOs;

/// <summary>Payload for creating a new deck.</summary>
public sealed record CreateDeckRequest(string Name, string? Description);

/// <summary>Payload for renaming a deck.</summary>
public sealed record UpdateDeckRequest(string Name, string? Description);

/// <summary>Deck summary returned in list and detail responses.</summary>
public sealed record DeckDto(
    Guid Id,
    string Name,
    string? Description,
    int CardCount,
    DateTime CreatedAt);
