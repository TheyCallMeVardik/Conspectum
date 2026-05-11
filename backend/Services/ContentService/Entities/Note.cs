using System.Text.Json;

namespace ContentService.Entities;

/// <summary>
/// A rich-text note (конспект) authored by a user.
/// The content is stored as a ProseMirror/Tiptap JSON document.
/// </summary>
public sealed class Note
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the owning user's id (foreign key from AuthService).</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the human-readable title of the note.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the Tiptap/ProseMirror document stored as raw JSON.
    /// Stored as <c>jsonb</c> in PostgreSQL via EF's JSON column support.
    /// </summary>
    public JsonDocument ContentJson { get; set; } = JsonDocument.Parse("{}");

    /// <summary>Gets or sets the UTC creation timestamp.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Gets or sets the optional folder this note belongs to.</summary>
    public Guid? FolderId { get; set; }

    /// <summary>Navigation property to the parent folder.</summary>
    public NoteFolder? Folder { get; set; }

    /// <summary>Gets or sets the UTC last-update timestamp.</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
