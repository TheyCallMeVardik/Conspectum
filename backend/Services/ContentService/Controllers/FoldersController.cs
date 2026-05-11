using ContentService.DTOs;
using ContentService.Services;
using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ContentService.Controllers;

[ApiController]
[Route("api/folders")]
[Authorize]
public sealed class FoldersController(IFolderService folderService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FolderDto>>), 200)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var folders = await folderService.GetAllAsync(User.GetUserId(), ct);
        return Ok(ApiResponse<IReadOnlyList<FolderDto>>.Ok(folders));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<FolderDto>), 201)]
    public async Task<IActionResult> Create([FromBody] CreateFolderRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<FolderDto>.Fail("Name is required."));

        var folder = await folderService.CreateAsync(User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetAll), ApiResponse<FolderDto>.Ok(folder));
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<FolderDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Rename(Guid id, [FromBody] RenameFolderRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<FolderDto>.Fail("Name is required."));

        try
        {
            var folder = await folderService.RenameAsync(User.GetUserId(), id, request, ct);
            return Ok(ApiResponse<FolderDto>.Ok(folder));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<FolderDto>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
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
