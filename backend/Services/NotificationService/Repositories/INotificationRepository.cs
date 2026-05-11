using NotificationService.Entities;

namespace NotificationService.Repositories;

/// <summary>
/// Abstraction over notification persistence.
/// </summary>
public interface INotificationRepository
{
    /// <summary>Returns all notifications for a user, newest first.</summary>
    Task<IReadOnlyList<Notification>> GetByUserAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Returns unread notifications for a user.</summary>
    Task<IReadOnlyList<Notification>> GetUnreadByUserAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Persists a new notification.</summary>
    Task AddAsync(Notification notification, CancellationToken ct = default);

    /// <summary>Marks a specific notification as read.</summary>
    Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default);

    /// <summary>Marks all notifications for a user as read.</summary>
    Task MarkAllReadAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Commits pending changes.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
