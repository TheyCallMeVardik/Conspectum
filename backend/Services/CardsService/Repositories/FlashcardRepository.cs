using CardsService.Data;
using CardsService.Entities;
using Microsoft.EntityFrameworkCore;

namespace CardsService.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IFlashcardRepository"/>.
/// </summary>
public sealed class FlashcardRepository(CardsDbContext db) : IFlashcardRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<Flashcard>> GetByUserAsync(
        Guid userId, Guid? deckId = null, CancellationToken ct = default)
    {
        var query = db.Flashcards.Where(f => f.UserId == userId);
        if (deckId.HasValue) query = query.Where(f => f.DeckId == deckId);
        return await query.OrderByDescending(f => f.CreatedAt).ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Flashcard>> GetDueAsync(
        Guid userId, Guid? deckId = null, CancellationToken ct = default)
    {
        var query = db.Flashcards.Where(f => f.UserId == userId && f.NextReview <= DateTime.UtcNow);
        if (deckId.HasValue) query = query.Where(f => f.DeckId == deckId);
        return await query.OrderBy(f => f.NextReview).ToListAsync(ct);
    }

    /// <inheritdoc />
    public Task<Flashcard?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Flashcards.FindAsync([id], ct).AsTask();

    /// <inheritdoc />
    public async Task AddAsync(Flashcard card, CancellationToken ct = default) =>
        await db.Flashcards.AddAsync(card, ct);

    /// <inheritdoc />
    public void Remove(Flashcard card) => db.Flashcards.Remove(card);

    /// <inheritdoc />
    public Task SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
