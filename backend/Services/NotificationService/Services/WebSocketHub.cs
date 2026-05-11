using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace NotificationService.Services;

/// <summary>
/// Maintains active WebSocket connections keyed by user id and pushes messages to them.
/// Intended for real-time in-app notification delivery.
/// </summary>
public sealed class WebSocketHub
{
    private readonly ConcurrentDictionary<Guid, List<WebSocket>> _sockets = new();

    /// <summary>
    /// Registers an open WebSocket for the given user.
    /// Keeps the connection alive until the client disconnects.
    /// </summary>
    public async Task HandleAsync(Guid userId, WebSocket socket, CancellationToken ct)
    {
        _sockets.GetOrAdd(userId, _ => []).Add(socket);

        var buffer = new byte[1024];
        try
        {
            while (socket.State == WebSocketState.Open && !ct.IsCancellationRequested)
            {
                var result = await socket.ReceiveAsync(buffer, ct);
                if (result.MessageType == WebSocketMessageType.Close)
                    break;
            }
        }
        finally
        {
            if (_sockets.TryGetValue(userId, out var list))
                list.Remove(socket);
        }
    }

    /// <summary>
    /// Pushes a JSON-serialized message to all active WebSocket connections for a user.
    /// </summary>
    public async Task SendAsync(Guid userId, object payload, CancellationToken ct = default)
    {
        if (!_sockets.TryGetValue(userId, out var sockets)) return;

        var json = JsonSerializer.Serialize(payload);
        var bytes = Encoding.UTF8.GetBytes(json);
        var segment = new ArraySegment<byte>(bytes);

        foreach (var socket in sockets.ToList())
        {
            if (socket.State != WebSocketState.Open) continue;

            try
            {
                await socket.SendAsync(segment, WebSocketMessageType.Text, true, ct);
            }
            catch (Exception)
            {
                // Client disconnected – remove on next cleanup cycle
            }
        }
    }
}
