using ContentService.DTOs;
using FluentValidation;

namespace ContentService.Validators;

/// <summary>
/// FluentValidation rules for <see cref="UpsertNoteRequest"/>.
/// </summary>
public sealed class UpsertNoteRequestValidator : AbstractValidator<UpsertNoteRequest>
{
    /// <summary>Initializes validation rules.</summary>
    public UpsertNoteRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(512);

        RuleFor(x => x.ContentJson)
            .Must(json => json.ValueKind == System.Text.Json.JsonValueKind.Object)
            .WithMessage("ContentJson must be a JSON object (Tiptap document).");
    }
}
