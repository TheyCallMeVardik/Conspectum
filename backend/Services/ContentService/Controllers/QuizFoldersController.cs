using ContentService.DTOs;
using ContentService.Services;
using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ContentService.Controllers;

[ApiController]
[Route("api/quiz-folders")]
[Authorize]
public sealed class QuizFoldersController(IQuizFolderService folderService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var folders = await folderService.GetAllAsync(User.GetUserId(), ct);
        return Ok(ApiResponse<IReadOnlyList<QuizFolderDto>>.Ok(folders));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertQuizFolderRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<QuizFolderDto>.Fail("Name is required."));
        var folder = await folderService.CreateAsync(User.GetUserId(), request, ct);
        return StatusCode(201, ApiResponse<QuizFolderDto>.Ok(folder));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Rename(Guid id, [FromBody] UpsertQuizFolderRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<QuizFolderDto>.Fail("Name is required."));
        try
        {
            var folder = await folderService.RenameAsync(User.GetUserId(), id, request, ct);
            return Ok(ApiResponse<QuizFolderDto>.Ok(folder));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await folderService.DeleteAsync(User.GetUserId(), id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
