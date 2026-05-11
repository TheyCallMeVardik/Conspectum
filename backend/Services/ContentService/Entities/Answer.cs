namespace ContentService.Entities;

/// <summary>
/// A candidate answer to a <see cref="Question"/>.
/// </summary>
public sealed class Answer
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the parent question id.</summary>
    public Guid QuestionId { get; set; }

    /// <summary>Gets or sets the answer text.</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Gets or sets a value indicating whether this is the correct answer.</summary>
    public bool IsCorrect { get; set; }

    /// <summary>Navigation property – the parent question.</summary>
    public Question Question { get; set; } = null!;
}
