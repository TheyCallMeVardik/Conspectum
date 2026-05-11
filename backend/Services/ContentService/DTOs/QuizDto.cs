using ContentService.Entities;

namespace ContentService.DTOs;

/// <summary>Answer candidate for quiz creation.</summary>
public sealed record AnswerRequest(string Text, bool IsCorrect);

/// <summary>Question for quiz creation.</summary>
public sealed record QuestionRequest(
    string Text,
    IReadOnlyList<AnswerRequest> Answers,
    QuestionType Type = QuestionType.MultipleChoice,
    string? CorrectTextAnswer = null);

/// <summary>Payload for creating a quiz.</summary>
public sealed record CreateQuizRequest(string Title, IReadOnlyList<QuestionRequest> Questions, Guid? FolderId = null);

/// <summary>Answer detail returned in responses.</summary>
public sealed record AnswerDto(Guid Id, string Text, bool IsCorrect);

/// <summary>Question detail returned in responses.</summary>
public sealed record QuestionDto(
    Guid Id,
    string Text,
    IReadOnlyList<AnswerDto> Answers,
    QuestionType Type,
    string? CorrectTextAnswer);

/// <summary>Full quiz detail.</summary>
public sealed record QuizDetailDto(
    Guid Id,
    string Title,
    DateTime CreatedAt,
    IReadOnlyList<QuestionDto> Questions);

/// <summary>Quiz summary for list responses.</summary>
public sealed record QuizSummaryDto(Guid Id, string Title, int QuestionCount, DateTime CreatedAt, Guid? FolderId = null);

/// <summary>Quiz folder DTO.</summary>
public sealed record QuizFolderDto(Guid Id, string Name, string? Description, int QuizCount);

/// <summary>Payload for creating or renaming a quiz folder.</summary>
public sealed record UpsertQuizFolderRequest(string Name, string? Description = null);
