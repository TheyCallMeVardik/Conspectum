namespace ContentService.Entities;

/// <summary>
/// A quiz (тест) created by a user, containing one or more questions.
/// </summary>
public sealed class Quiz
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the owning user's id.</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the quiz title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Gets or sets the UTC creation timestamp.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Gets or sets the optional folder this quiz belongs to.</summary>
    public Guid? FolderId { get; set; }

    /// <summary>Navigation property – the folder this quiz belongs to.</summary>
    public QuizFolder? Folder { get; set; }

    /// <summary>Navigation property – questions belonging to this quiz.</summary>
    public ICollection<Question> Questions { get; set; } = [];
}
