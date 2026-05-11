namespace CardsService.Entities;

/// <summary>
/// A named collection (deck) that groups related flashcards.
/// </summary>
public sealed class Deck
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the owning user's id.</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the deck name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Gets or sets the optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Gets or sets the UTC creation timestamp.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Navigation — cards belonging to this deck.</summary>
    public ICollection<Flashcard> Flashcards { get; set; } = [];
}
