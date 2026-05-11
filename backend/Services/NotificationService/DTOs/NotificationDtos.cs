namespace NotificationService.DTOs;

/// <summary>Notification item returned in API responses.</summary>
public sealed record NotificationDto(
    Guid Id,
    string Message,
    DateTime ScheduledAt,
    DateTime? SentAt,
    bool IsRead);

/// <summary>Payload published to the Kafka <c>notification.schedule</c> topic.</summary>
public sealed record ScheduleNotificationEvent(
    Guid UserId,
    string Message,
    DateTime ScheduledAt);
