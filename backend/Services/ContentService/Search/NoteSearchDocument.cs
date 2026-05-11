namespace ContentService.Search;

/// <summary>
/// The document shape indexed into Elasticsearch for full-text note search.
/// </summary>
public sealed class NoteSearchDocument
{
    /// <summary>Gets or sets the note's primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the owning user's id (used to scope search results).</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the note title (boosted in search).</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the plain-text extraction of the Tiptap document,
    /// used for full-text matching.
    /// </summary>
    public string PlainText { get; set; } = string.Empty;

    /// <summary>Gets or sets the UTC creation timestamp.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Gets or sets the UTC last-update timestamp.</summary>
    public DateTime UpdatedAt { get; set; }
}
