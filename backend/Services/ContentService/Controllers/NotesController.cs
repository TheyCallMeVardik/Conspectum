using ContentService.DTOs;
using ContentService.Services;
using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ContentService.Controllers;

/// <summary>
/// CRUD endpoints for rich-text notes (конспекты).
/// All endpoints require a valid JWT bearer token.
/// </summary>
[ApiController]
[Route("api/notes")]
[Authorize]
public sealed class NotesController(
    INoteService noteService,
    IValidator<UpsertNoteRequest> validator) : ControllerBase
{
    /// <summary>Returns all notes belonging to the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NoteSummaryDto>>), 200)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var notes = await noteService.GetAllAsync(User.GetUserId(), ct);
        return Ok(ApiResponse<IReadOnlyList<NoteSummaryDto>>.Ok(notes));
    }

    /// <summary>Returns a single note's full content by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<NoteDetailDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var note = await noteService.GetByIdAsync(User.GetUserId(), id, ct);
            return Ok(ApiResponse<NoteDetailDto>.Ok(note));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<NoteDetailDto>.Fail(ex.Message)); }
    }

    /// <summary>Creates a new note and indexes it in Elasticsearch.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<NoteDetailDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<NoteDetailDto>), 400)]
    public async Task<IActionResult> Create([FromBody] UpsertNoteRequest request, CancellationToken ct)
    {
        var v = await validator.ValidateAsync(request, ct);
        if (!v.IsValid) return BadRequest(ApiResponse<NoteDetailDto>.ValidationFail(v.ToDictionary()));

        var note = await noteService.CreateAsync(User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { id = note.Id },
            ApiResponse<NoteDetailDto>.Ok(note));
    }

    /// <summary>Updates an existing note's title and content.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<NoteDetailDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<NoteDetailDto>), 400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpsertNoteRequest request, CancellationToken ct)
    {
        var v = await validator.ValidateAsync(request, ct);
        if (!v.IsValid) return BadRequest(ApiResponse<NoteDetailDto>.ValidationFail(v.ToDictionary()));

        try
        {
            var note = await noteService.UpdateAsync(User.GetUserId(), id, request, ct);
            return Ok(ApiResponse<NoteDetailDto>.Ok(note));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<NoteDetailDto>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>Deletes a note by id.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await noteService.DeleteAsync(User.GetUserId(), id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>Full-text search over the authenticated user's notes.</summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NoteSummaryDto>>), 200)]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(ApiResponse<IReadOnlyList<NoteSummaryDto>>.Fail("Query is required."));

        var results = await noteService.SearchAsync(User.GetUserId(), q, ct);
        return Ok(ApiResponse<IReadOnlyList<NoteSummaryDto>>.Ok(results));
    }
}
