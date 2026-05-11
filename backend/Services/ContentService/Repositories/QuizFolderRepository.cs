using ContentService.Data;
using ContentService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContentService.Repositories;

public sealed class QuizFolderRepository(ContentDbContext db) : IQuizFolderRepository
{
    public async Task<IReadOnlyList<QuizFolder>> GetByUserAsync(Guid userId, CancellationToken ct = default) =>
        await db.QuizFolders
            .Where(f => f.UserId == userId)
            .Include(f => f.Quizzes)
            .OrderBy(f => f.Name)
            .ToListAsync(ct);

    public Task<QuizFolder?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.QuizFolders.Include(f => f.Quizzes).FirstOrDefaultAsync(f => f.Id == id, ct);

    public async Task AddAsync(QuizFolder folder, CancellationToken ct = default) =>
        await db.QuizFolders.AddAsync(folder, ct);

    public void Remove(QuizFolder folder) => db.QuizFolders.Remove(folder);

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
