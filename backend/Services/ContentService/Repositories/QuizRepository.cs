using ContentService.Data;
using ContentService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContentService.Repositories;

public sealed class QuizRepository(ContentDbContext db) : IQuizRepository
{
    public async Task<IReadOnlyList<Quiz>> GetByUserAsync(Guid userId, string? search = null, CancellationToken ct = default)
    {
        IQueryable<Quiz> query = db.Quizzes
            .Include(q => q.Questions)
            .Where(q => q.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(q => q.Title.ToLower().Contains(search.ToLower()));

        return await query.OrderByDescending(q => q.CreatedAt).ToListAsync(ct);
    }

    public Task<Quiz?> GetByIdWithQuestionsAsync(Guid id, CancellationToken ct = default) =>
        db.Quizzes
          .Include(q => q.Questions)
              .ThenInclude(q => q.Answers)
          .FirstOrDefaultAsync(q => q.Id == id, ct);

    public async Task AddAsync(Quiz quiz, CancellationToken ct = default) =>
        await db.Quizzes.AddAsync(quiz, ct);

    public void Remove(Quiz quiz) => db.Quizzes.Remove(quiz);

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
