using CardsService.DTOs;
using CardsService.Entities;
using CardsService.Repositories;

namespace CardsService.Services;

/// <summary>Concrete implementation of <see cref="IDeckService"/>.</summary>
public sealed class DeckService(IDeckRepository deckRepo) : IDeckService
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<DeckDto>> GetAllAsync(Guid userId, CancellationToken ct = default)
    {
        var decks = await deckRepo.GetByUserAsync(userId, ct);
        return decks.Select(ToDto).ToList();
    }

    /// <inheritdoc />
    public async Task<DeckDto> CreateAsync(Guid userId, CreateDeckRequest request, CancellationToken ct = default)
    {
        var deck = new Deck { UserId = userId, Name = request.Name, Description = request.Description };
        await deckRepo.AddAsync(deck, ct);
        await deckRepo.SaveChangesAsync(ct);
        return ToDto(deck);
    }

    /// <inheritdoc />
    public async Task<DeckDto> UpdateAsync(Guid userId, Guid deckId, UpdateDeckRequest request, CancellationToken ct = default)
    {
        var deck = await FindAndAuthorize(userId, deckId, ct);
        deck.Name = request.Name;
        deck.Description = request.Description;
        await deckRepo.SaveChangesAsync(ct);
        return ToDto(deck);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(Guid userId, Guid deckId, CancellationToken ct = default)
    {
        var deck = await FindAndAuthorize(userId, deckId, ct);
        deckRepo.Remove(deck);
        await deckRepo.SaveChangesAsync(ct);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private async Task<Deck> FindAndAuthorize(Guid userId, Guid deckId, CancellationToken ct)
    {
        var deck = await deckRepo.GetByIdAsync(deckId, ct)
            ?? throw new KeyNotFoundException($"Deck {deckId} not found.");
        if (deck.UserId != userId) throw new UnauthorizedAccessException("Access denied.");
        return deck;
    }

    private static DeckDto ToDto(Deck d) =>
        new(d.Id, d.Name, d.Description, d.Flashcards.Count, d.CreatedAt);
}
