using CardsService.DTOs;
using CardsService.Services;
using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CardsService.Controllers;

/// <summary>
/// Deck CRUD endpoints. All require a valid JWT bearer token.
/// </summary>
[ApiController]
[Route("api/decks")]
[Authorize]
public sealed class DecksController(IDeckService deckService) : ControllerBase
{
    /// <summary>Returns all decks for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<DeckDto>>), 200)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var decks = await deckService.GetAllAsync(User.GetUserId(), ct);
        return Ok(ApiResponse<IReadOnlyList<DeckDto>>.Ok(decks));
    }

    /// <summary>Creates a new deck.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DeckDto>), 201)]
    public async Task<IActionResult> Create([FromBody] CreateDeckRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<DeckDto>.Fail("Name is required."));

        var deck = await deckService.CreateAsync(User.GetUserId(), request, ct);
        return StatusCode(201, ApiResponse<DeckDto>.Ok(deck));
    }

    /// <summary>Updates a deck's name and description.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DeckDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDeckRequest request, CancellationToken ct)
    {
        try
        {
            var deck = await deckService.UpdateAsync(User.GetUserId(), id, request, ct);
            return Ok(ApiResponse<DeckDto>.Ok(deck));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<DeckDto>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>Deletes a deck. Cards in the deck become deckless (DeckId set to null).</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await deckService.DeleteAsync(User.GetUserId(), id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
