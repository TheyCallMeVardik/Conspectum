using System.Text.Json;

namespace ContentService.Entities;

public sealed class LearningTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public JsonDocument? DescriptionJson { get; set; }
    public LearningTaskStatus Status { get; set; } = LearningTaskStatus.Queued;
    public DateTime? Deadline { get; set; }
    public LearningMaterialType? MaterialType { get; set; }
    public Guid? MaterialId { get; set; }
    public string? MaterialTitle { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum LearningTaskStatus { Queued, InProgress, Done }
public enum LearningMaterialType { Note, Deck, Quiz }
