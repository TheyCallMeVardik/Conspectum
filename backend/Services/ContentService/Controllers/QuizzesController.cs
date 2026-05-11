using ContentService.DTOs;
using ContentService.Services;
using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ContentService.Controllers;

/// <summary>
/// CRUD endpoints for quizzes (тесты).
/// All endpoints require a valid JWT bearer token.
/// </summary>
[ApiController]
[Route("api/quizzes")]
[Authorize]
public sealed class QuizzesController(
    IQuizService quizService,
    IValidator<CreateQuizRequest> validator) : ControllerBase
{
    /// <summary>Returns all quizzes belonging to the authenticated user. Supports ?q= search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<QuizSummaryDto>>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] string? q, CancellationToken ct)
    {
        var quizzes = await quizService.GetAllAsync(User.GetUserId(), q, ct);
        return Ok(ApiResponse<IReadOnlyList<QuizSummaryDto>>.Ok(quizzes));
    }

    /// <summary>Returns a quiz with all questions and answers.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<QuizDetailDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var quiz = await quizService.GetByIdAsync(User.GetUserId(), id, ct);
            return Ok(ApiResponse<QuizDetailDto>.Ok(quiz));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<QuizDetailDto>.Fail(ex.Message)); }
    }

    /// <summary>Creates a quiz with its questions and answer choices.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<QuizDetailDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<QuizDetailDto>), 400)]
    public async Task<IActionResult> Create([FromBody] CreateQuizRequest request, CancellationToken ct)
    {
        var v = await validator.ValidateAsync(request, ct);
        if (!v.IsValid) return BadRequest(ApiResponse<QuizDetailDto>.ValidationFail(v.ToDictionary()));

        var quiz = await quizService.CreateAsync(User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { id = quiz.Id },
            ApiResponse<QuizDetailDto>.Ok(quiz));
    }

    /// <summary>Deletes a quiz and all its questions and answers (cascade).</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await quizService.DeleteAsync(User.GetUserId(), id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
