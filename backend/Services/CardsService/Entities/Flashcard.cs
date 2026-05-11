namespace CardsService.Entities;

/// <summary>
/// An Anki-style flashcard managed by the SM-2 spaced-repetition algorithm.
/// </summary>
public sealed class Flashcard
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the owning user's id.</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the front (question) side of the card.</summary>
    public string Front { get; set; } = string.Empty;

    /// <summary>Gets or sets the back (answer) side of the card.</summary>
    public string Back { get; set; } = string.Empty;

    // ── SM-2 scheduler fields ─────────────────────────────────────────────────

    /// <summary>Gets or sets the current inter-repetition interval in days.</summary>
    public int Interval { get; set; } = 1;

    /// <summary>Gets or sets the number of successful repetitions in a row.</summary>
    public int Repetitions { get; set; } = 0;

    /// <summary>
    /// Gets or sets the ease factor (E-Factor) used by SM-2.
    /// Initial value is 2.5 per algorithm specification.
    /// </summary>
    public double EaseFactor { get; set; } = 2.5;

    /// <summary>Gets or sets the UTC date when the card should next be reviewed.</summary>
    public DateTime NextReview { get; set; } = DateTime.UtcNow;

    /// <summary>Gets or sets the UTC creation timestamp.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Gets or sets the optional deck this card belongs to.</summary>
    public Guid? DeckId { get; set; }

    /// <summary>Navigation — the deck this card belongs to.</summary>
    public Deck? Deck { get; set; }
}
