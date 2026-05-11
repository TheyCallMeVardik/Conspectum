using CardsService.DTOs;
using CardsService.Services;
using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CardsService.Controllers;

/// <summary>
/// Flashcard CRUD and SM-2 review session endpoints.
/// All endpoints require a valid JWT bearer token.
/// </summary>
[ApiController]
[Route("api/flashcards")]
[Authorize]
public sealed class FlashcardsController(
    IFlashcardService flashcardService,
    IValidator<CreateFlashcardRequest> createValidator,
    IValidator<UpdateFlashcardRequest> updateValidator,
    IValidator<ReviewRequest> reviewValidator) : ControllerBase
{
    /// <summary>Returns all flashcards for the authenticated user, optionally filtered by deck.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FlashcardDto>>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] Guid? deckId, CancellationToken ct)
    {
        var cards = await flashcardService.GetAllAsync(User.GetUserId(), deckId, ct);
        return Ok(ApiResponse<IReadOnlyList<FlashcardDto>>.Ok(cards));
    }

    /// <summary>Returns all cards currently due for review, optionally filtered by deck.</summary>
    [HttpGet("due")]
    [ProducesResponseType(typeof(ApiResponse<ReviewSessionSummaryDto>), 200)]
    public async Task<IActionResult> GetDue([FromQuery] Guid? deckId, CancellationToken ct)
    {
        var session = await flashcardService.GetDueAsync(User.GetUserId(), deckId, ct);
        return Ok(ApiResponse<ReviewSessionSummaryDto>.Ok(session));
    }

    /// <summary>Returns a single flashcard by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var card = await flashcardService.GetByIdAsync(User.GetUserId(), id, ct);
            return Ok(ApiResponse<FlashcardDto>.Ok(card));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<FlashcardDto>.Fail(ex.Message)); }
    }

    /// <summary>Creates a new flashcard.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), 400)]
    public async Task<IActionResult> Create([FromBody] CreateFlashcardRequest request, CancellationToken ct)
    {
        var v = await createValidator.ValidateAsync(request, ct);
        if (!v.IsValid) return BadRequest(ApiResponse<FlashcardDto>.ValidationFail(v.ToDictionary()));

        var card = await flashcardService.CreateAsync(User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { id = card.Id },
            ApiResponse<FlashcardDto>.Ok(card));
    }

    /// <summary>Updates the front/back text of a flashcard.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), 400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateFlashcardRequest request, CancellationToken ct)
    {
        var v = await updateValidator.ValidateAsync(request, ct);
        if (!v.IsValid) return BadRequest(ApiResponse<FlashcardDto>.ValidationFail(v.ToDictionary()));

        try
        {
            var card = await flashcardService.UpdateAsync(User.GetUserId(), id, request, ct);
            return Ok(ApiResponse<FlashcardDto>.Ok(card));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<FlashcardDto>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>Deletes a flashcard.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await flashcardService.DeleteAsync(User.GetUserId(), id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Submits a review result for a flashcard.
    /// The SM-2 algorithm recalculates the next review date and updates the card.
    /// </summary>
    [HttpPost("{id:guid}/review")]
    [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<FlashcardDto>), 400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Review(
        Guid id, [FromBody] ReviewRequest request, CancellationToken ct)
    {
        var v = await reviewValidator.ValidateAsync(request, ct);
        if (!v.IsValid) return BadRequest(ApiResponse<FlashcardDto>.ValidationFail(v.ToDictionary()));

        try
        {
            var card = await flashcardService.ReviewAsync(User.GetUserId(), id, request, ct);
            return Ok(ApiResponse<FlashcardDto>.Ok(card));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<FlashcardDto>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
