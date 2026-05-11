using ContentService.DTOs;
using ContentService.Entities;
using ContentService.Repositories;

namespace ContentService.Services;

public sealed class QuizService(IQuizRepository quizRepo) : IQuizService
{
    public async Task<IReadOnlyList<QuizSummaryDto>> GetAllAsync(
        Guid userId, string? search = null, CancellationToken ct = default)
    {
        var quizzes = await quizRepo.GetByUserAsync(userId, search, ct);
        return quizzes.Select(q => new QuizSummaryDto(
            q.Id, q.Title, q.Questions.Count, q.CreatedAt, q.FolderId)).ToList();
    }

    public async Task<QuizDetailDto> GetByIdAsync(
        Guid userId, Guid quizId, CancellationToken ct = default)
    {
        var quiz = await FindAndAuthorize(userId, quizId, ct);
        return ToDetail(quiz);
    }

    public async Task<QuizDetailDto> CreateAsync(
        Guid userId, CreateQuizRequest request, CancellationToken ct = default)
    {
        var quiz = new Quiz
        {
            UserId = userId,
            Title = request.Title,
            FolderId = request.FolderId,
            Questions = request.Questions.Select(q => new Question
            {
                Text = q.Text,
                Type = q.Type,
                CorrectTextAnswer = q.CorrectTextAnswer,
                Answers = q.Answers.Select(a => new Answer
                {
                    Text = a.Text,
                    IsCorrect = a.IsCorrect,
                }).ToList(),
            }).ToList(),
        };

        await quizRepo.AddAsync(quiz, ct);
        await quizRepo.SaveChangesAsync(ct);

        var created = await quizRepo.GetByIdWithQuestionsAsync(quiz.Id, ct)!;
        return ToDetail(created!);
    }

    public async Task DeleteAsync(Guid userId, Guid quizId, CancellationToken ct = default)
    {
        var quiz = await FindAndAuthorize(userId, quizId, ct);
        quizRepo.Remove(quiz);
        await quizRepo.SaveChangesAsync(ct);
    }

    private async Task<Quiz> FindAndAuthorize(Guid userId, Guid quizId, CancellationToken ct)
    {
        var quiz = await quizRepo.GetByIdWithQuestionsAsync(quizId, ct)
            ?? throw new KeyNotFoundException($"Quiz {quizId} not found.");
        if (quiz.UserId != userId)
            throw new UnauthorizedAccessException("Access denied.");
        return quiz;
    }

    private static QuizDetailDto ToDetail(Quiz q) => new(
        q.Id, q.Title, q.CreatedAt,
        q.Questions.Select(question => new QuestionDto(
            question.Id, question.Text,
            question.Answers.Select(a => new AnswerDto(a.Id, a.Text, a.IsCorrect)).ToList(),
            question.Type, question.CorrectTextAnswer
        )).ToList());
}
