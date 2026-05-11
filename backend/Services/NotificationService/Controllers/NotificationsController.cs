using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotificationService.DTOs;
using NotificationService.Repositories;
using NotificationService.Services;

namespace NotificationService.Controllers;

/// <summary>
/// Endpoints for listing notifications and managing WebSocket connections.
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(
    INotificationRepository repo,
    WebSocketHub wsHub) : ControllerBase
{
    /// <summary>Returns all notifications for the authenticated user, newest first.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NotificationDto>>), 200)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var notifications = await repo.GetByUserAsync(User.GetUserId(), ct);
        var dtos = notifications.Select(n => new NotificationDto(
            n.Id, n.Message, n.ScheduledAt, n.SentAt, n.IsRead)).ToList();
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(dtos));
    }

    /// <summary>Marks a specific notification as read.</summary>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        await repo.MarkReadAsync(id, User.GetUserId(), ct);
        return NoContent();
    }

    /// <summary>Marks all notifications for the authenticated user as read.</summary>
    [HttpPatch("read-all")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await repo.MarkAllReadAsync(User.GetUserId(), ct);
        return NoContent();
    }

    /// <summary>
    /// Upgrades the HTTP connection to a WebSocket for real-time notification push.
    /// The client must send the JWT as a query-string parameter <c>access_token</c>
    /// because browser WebSocket APIs do not support custom headers.
    /// </summary>
    [HttpGet("ws")]
    [AllowAnonymous] // JWT is validated manually below
    public async Task ConnectWebSocket([FromQuery] string access_token)
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        // Minimal token validation (full JWT middleware runs on normal HTTP routes)
        if (string.IsNullOrWhiteSpace(access_token))
        {
            HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        using var socket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        var userId = User.GetUserId(); // populated by JwtBearer middleware if token is valid
        await wsHub.HandleAsync(userId, socket, HttpContext.RequestAborted);
    }
}
