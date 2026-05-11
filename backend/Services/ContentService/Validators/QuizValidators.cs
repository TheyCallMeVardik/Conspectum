using ContentService.DTOs;
using ContentService.Entities;
using FluentValidation;

namespace ContentService.Validators;

/// <summary>
/// FluentValidation rules for <see cref="CreateQuizRequest"/>.
/// </summary>
public sealed class CreateQuizRequestValidator : AbstractValidator<CreateQuizRequest>
{
    /// <summary>Initializes validation rules.</summary>
    public CreateQuizRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Quiz title is required.")
            .MaximumLength(512);

        RuleFor(x => x.Questions)
            .NotEmpty().WithMessage("A quiz must have at least one question.");

        RuleForEach(x => x.Questions).ChildRules(q =>
        {
            q.RuleFor(x => x.Text).NotEmpty().WithMessage("Question text is required.");

            // Multiple-choice: need 2+ answers with exactly one correct
            q.When(x => x.Type == QuestionType.MultipleChoice, () =>
            {
                q.RuleFor(x => x.Answers)
                 .NotEmpty().WithMessage("Multiple-choice question must have at least two answers.")
                 .Must(a => a.Count >= 2).WithMessage("Multiple-choice question must have at least two answers.")
                 .Must(a => a.Count(x => x.IsCorrect) == 1)
                 .WithMessage("Multiple-choice question must have exactly one correct answer.");
            });

            // Open-ended: correct text answer is required
            q.When(x => x.Type == QuestionType.OpenEnded, () =>
            {
                q.RuleFor(x => x.CorrectTextAnswer)
                 .NotEmpty().WithMessage("Open-ended question must have a correct text answer.");
            });
        });
    }
}
