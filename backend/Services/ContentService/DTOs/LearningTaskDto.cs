using System.Text.Json;
using ContentService.Entities;

namespace ContentService.DTOs;

public sealed record CreateLearningTaskRequest(
    string Title,
    JsonElement? DescriptionJson,
    LearningTaskStatus Status,
    DateTime? Deadline,
    LearningMaterialType? MaterialType,
    Guid? MaterialId,
    string? MaterialTitle);

public sealed record UpdateLearningTaskRequest(
    string Title,
    JsonElement? DescriptionJson,
    LearningTaskStatus Status,
    DateTime? Deadline,
    LearningMaterialType? MaterialType,
    Guid? MaterialId,
    string? MaterialTitle);

public sealed record LearningTaskDto(
    Guid Id,
    string Title,
    JsonElement? DescriptionJson,
    LearningTaskStatus Status,
    DateTime? Deadline,
    LearningMaterialType? MaterialType,
    Guid? MaterialId,
    string? MaterialTitle,
    DateTime CreatedAt,
    DateTime UpdatedAt);
