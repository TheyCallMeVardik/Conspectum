using ContentService.DTOs;
using ContentService.Repositories;
using ContentService.Services;
using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ContentService.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public sealed class LearningTasksController(
    ILearningTaskService taskService,
    ILearningTaskRepository taskRepository) : ControllerBase
{
    /// <summary>Internal endpoint: tasks with deadline within the next N hours (no auth required).</summary>
    [HttpGet("/internal/tasks/upcoming-deadlines")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUpcomingDeadlines(
        [FromQuery] int hoursAhead = 24, CancellationToken ct = default)
    {
        var tasks = await taskRepository.GetUpcomingDeadlinesAsync(hoursAhead, ct);
        var result = tasks.Select(t => new
        {
            userId = t.UserId,
            taskId = t.Id,
            title = t.Title,
            deadline = t.Deadline,
        });
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var tasks = await taskService.GetAllAsync(User.GetUserId(), ct);
        return Ok(ApiResponse<IReadOnlyList<LearningTaskDto>>.Ok(tasks));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        try
        {
            var task = await taskService.GetByIdAsync(User.GetUserId(), id, ct);
            return Ok(ApiResponse<LearningTaskDto>.Ok(task));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<LearningTaskDto>.Fail(ex.Message)); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLearningTaskRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(ApiResponse<LearningTaskDto>.Fail("Title is required."));

        var task = await taskService.CreateAsync(User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, ApiResponse<LearningTaskDto>.Ok(task));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLearningTaskRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(ApiResponse<LearningTaskDto>.Fail("Title is required."));

        try
        {
            var task = await taskService.UpdateAsync(User.GetUserId(), id, request, ct);
            return Ok(ApiResponse<LearningTaskDto>.Ok(task));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<LearningTaskDto>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try
        {
            await taskService.DeleteAsync(User.GetUserId(), id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.Fail(ex.Message)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
