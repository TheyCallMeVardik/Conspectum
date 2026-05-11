namespace ContentService.Entities;

/// <summary>Discriminates between question kinds.</summary>
public enum QuestionType
{
    /// <summary>User picks from a list of answer choices.</summary>
    MultipleChoice = 0,

    /// <summary>User types a free-text answer; checked against <see cref="Question.CorrectTextAnswer"/>.</summary>
    OpenEnded = 1,
}

/// <summary>
/// A single question within a <see cref="Quiz"/>.
/// </summary>
public sealed class Question
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the parent quiz id.</summary>
    public Guid QuizId { get; set; }

    /// <summary>Gets or sets the question text.</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Gets or sets the question type (multiple-choice or open-ended).</summary>
    public QuestionType Type { get; set; } = QuestionType.MultipleChoice;

    /// <summary>
    /// For <see cref="QuestionType.OpenEnded"/> questions: the expected correct answer.
    /// Checked case-insensitively and trimmed on the frontend.
    /// </summary>
    public string? CorrectTextAnswer { get; set; }

    /// <summary>Navigation property – the parent quiz.</summary>
    public Quiz Quiz { get; set; } = null!;

    /// <summary>Navigation property – candidate answers (empty for open-ended questions).</summary>
    public ICollection<Answer> Answers { get; set; } = [];
}
