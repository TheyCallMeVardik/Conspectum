using CardsService.Data;
using CardsService.Entities;
using Microsoft.EntityFrameworkCore;

namespace CardsService.Repositories;

/// <summary>EF Core implementation of <see cref="IDeckRepository"/>.</summary>
public sealed class DeckRepository(CardsDbContext db) : IDeckRepository
{
    public async Task<IReadOnlyList<Deck>> GetByUserAsync(Guid userId, CancellationToken ct = default) =>
        await db.Decks
            .Where(d => d.UserId == userId)
            .Include(d => d.Flashcards)
            .OrderBy(d => d.CreatedAt)
            .ToListAsync(ct);

    public Task<Deck?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Decks.Include(d => d.Flashcards).FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task AddAsync(Deck deck, CancellationToken ct = default) =>
        await db.Decks.AddAsync(deck, ct);

    public void Remove(Deck deck) => db.Decks.Remove(deck);

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
