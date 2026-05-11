namespace NotificationService.Entities;

/// <summary>
/// Represents a notification created for a user by the Quartz scheduler
/// or the Kafka consumer pipeline.
/// </summary>
public sealed class Notification
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the target user's id.</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the notification message body.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Gets or sets the UTC time when this notification should be (or was) delivered.</summary>
    public DateTime ScheduledAt { get; set; }

    /// <summary>Gets or sets the UTC time when the notification was actually delivered. Null until sent.</summary>
    public DateTime? SentAt { get; set; }

    /// <summary>Gets or sets a value indicating whether the user has read this notification.</summary>
    public bool IsRead { get; set; }
}
