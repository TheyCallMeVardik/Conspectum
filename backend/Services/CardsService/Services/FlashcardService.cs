using CardsService.Algorithm;
using CardsService.DTOs;
using CardsService.Entities;
using CardsService.Repositories;

namespace CardsService.Services;

/// <summary>
/// Concrete implementation of <see cref="IFlashcardService"/>.
/// </summary>
public sealed class FlashcardService(IFlashcardRepository repo) : IFlashcardService
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<FlashcardDto>> GetAllAsync(
        Guid userId, Guid? deckId = null, CancellationToken ct = default)
    {
        var cards = await repo.GetByUserAsync(userId, deckId, ct);
        return cards.Select(ToDto).ToList();
    }

    /// <inheritdoc />
    public async Task<ReviewSessionSummaryDto> GetDueAsync(
        Guid userId, Guid? deckId = null, CancellationToken ct = default)
    {
        var due = await repo.GetDueAsync(userId, deckId, ct);
        return new ReviewSessionSummaryDto(due.Count, due.Select(ToDto).ToList());
    }

    /// <inheritdoc />
    public async Task<FlashcardDto> GetByIdAsync(
        Guid userId, Guid cardId, CancellationToken ct = default) =>
        ToDto(await FindAndAuthorize(userId, cardId, ct));

    /// <inheritdoc />
    public async Task<FlashcardDto> CreateAsync(
        Guid userId, CreateFlashcardRequest request, CancellationToken ct = default)
    {
        var card = new Flashcard
        {
            UserId = userId,
            Front = request.Front,
            Back = request.Back,
            DeckId = request.DeckId,
        };
        await repo.AddAsync(card, ct);
        await repo.SaveChangesAsync(ct);
        return ToDto(card);
    }

    /// <inheritdoc />
    public async Task<FlashcardDto> UpdateAsync(
        Guid userId, Guid cardId, UpdateFlashcardRequest request, CancellationToken ct = default)
    {
        var card = await FindAndAuthorize(userId, cardId, ct);
        card.Front = request.Front;
        card.Back = request.Back;
        await repo.SaveChangesAsync(ct);
        return ToDto(card);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(Guid userId, Guid cardId, CancellationToken ct = default)
    {
        var card = await FindAndAuthorize(userId, cardId, ct);
        repo.Remove(card);
        await repo.SaveChangesAsync(ct);
    }

    /// <inheritdoc />
    public async Task<FlashcardDto> ReviewAsync(
        Guid userId, Guid cardId, ReviewRequest request, CancellationToken ct = default)
    {
        var card = await FindAndAuthorize(userId, cardId, ct);
        Sm2Algorithm.Apply(card, request.Quality);
        await repo.SaveChangesAsync(ct);
        return ToDto(card);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private async Task<Flashcard> FindAndAuthorize(Guid userId, Guid cardId, CancellationToken ct)
    {
        var card = await repo.GetByIdAsync(cardId, ct)
            ?? throw new KeyNotFoundException($"Flashcard {cardId} not found.");
        if (card.UserId != userId)
            throw new UnauthorizedAccessException("Access denied.");
        return card;
    }

    private static FlashcardDto ToDto(Flashcard c) => new(
        c.Id, c.Front, c.Back, c.Interval, c.Repetitions,
        c.EaseFactor, c.NextReview, c.CreatedAt, c.DeckId);
}
