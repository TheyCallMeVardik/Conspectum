using CardsService.Entities;

namespace CardsService.Repositories;

/// <summary>Data access contract for <see cref="Deck"/>.</summary>
public interface IDeckRepository
{
    Task<IReadOnlyList<Deck>> GetByUserAsync(Guid userId, CancellationToken ct = default);
    Task<Deck?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Deck deck, CancellationToken ct = default);
    void Remove(Deck deck);
    Task SaveChangesAsync(CancellationToken ct = default);
}
