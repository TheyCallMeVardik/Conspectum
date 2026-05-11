using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Entities;

namespace NotificationService.Repositories;

/// <summary>
/// EF Core implementation of <see cref="INotificationRepository"/>.
/// </summary>
public sealed class NotificationRepository(NotificationDbContext db) : INotificationRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<Notification>> GetByUserAsync(
        Guid userId, CancellationToken ct = default) =>
        await db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.ScheduledAt)
                .ToListAsync(ct);

    /// <inheritdoc />
    public async Task<IReadOnlyList<Notification>> GetUnreadByUserAsync(
        Guid userId, CancellationToken ct = default) =>
        await db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.ScheduledAt)
                .ToListAsync(ct);

    /// <inheritdoc />
    public async Task AddAsync(Notification notification, CancellationToken ct = default) =>
        await db.Notifications.AddAsync(notification, ct);

    /// <inheritdoc />
    public async Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default) =>
        await db.Notifications
                .Where(n => n.Id == notificationId && n.UserId == userId)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);

    /// <inheritdoc />
    public async Task MarkAllReadAsync(Guid userId, CancellationToken ct = default) =>
        await db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);

    /// <inheritdoc />
    public Task SaveChangesAsync(CancellationToken ct = default) =>
        db.SaveChangesAsync(ct);
}
