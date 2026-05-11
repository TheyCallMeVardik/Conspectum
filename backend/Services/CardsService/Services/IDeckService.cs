using CardsService.DTOs;

namespace CardsService.Services;

/// <summary>Business logic contract for deck management.</summary>
public interface IDeckService
{
    Task<IReadOnlyList<DeckDto>> GetAllAsync(Guid userId, CancellationToken ct = default);
    Task<DeckDto> CreateAsync(Guid userId, CreateDeckRequest request, CancellationToken ct = default);
    Task<DeckDto> UpdateAsync(Guid userId, Guid deckId, UpdateDeckRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid deckId, CancellationToken ct = default);
}
