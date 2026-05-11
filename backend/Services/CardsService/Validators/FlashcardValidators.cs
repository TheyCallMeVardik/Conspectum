using CardsService.DTOs;
using FluentValidation;

namespace CardsService.Validators;

/// <summary>FluentValidation rules for <see cref="CreateFlashcardRequest"/>.</summary>
public sealed class CreateFlashcardRequestValidator : AbstractValidator<CreateFlashcardRequest>
{
    /// <summary>Initializes validation rules.</summary>
    public CreateFlashcardRequestValidator()
    {
        RuleFor(x => x.Front).NotEmpty().WithMessage("Front text is required.").MaximumLength(2000);
        RuleFor(x => x.Back).NotEmpty().WithMessage("Back text is required.").MaximumLength(2000);
    }
}

/// <summary>FluentValidation rules for <see cref="UpdateFlashcardRequest"/>.</summary>
public sealed class UpdateFlashcardRequestValidator : AbstractValidator<UpdateFlashcardRequest>
{
    /// <summary>Initializes validation rules.</summary>
    public UpdateFlashcardRequestValidator()
    {
        RuleFor(x => x.Front).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Back).NotEmpty().MaximumLength(2000);
    }
}

/// <summary>FluentValidation rules for <see cref="ReviewRequest"/>.</summary>
public sealed class ReviewRequestValidator : AbstractValidator<ReviewRequest>
{
    /// <summary>Initializes validation rules.</summary>
    public ReviewRequestValidator()
    {
        RuleFor(x => x.Quality)
            .InclusiveBetween(0, 5)
            .WithMessage("Quality must be between 0 and 5.");
    }
}
