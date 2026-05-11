using System.Text.Json;

namespace ContentService.DTOs;

/// <summary>Payload for creating or updating a note.</summary>
public sealed record UpsertNoteRequest(string Title, JsonElement ContentJson, Guid? FolderId = null);

/// <summary>Note summary returned in list responses.</summary>
public sealed record NoteSummaryDto(Guid Id, string Title, Guid? FolderId, DateTime CreatedAt, DateTime UpdatedAt);

/// <summary>Full note returned in detail responses.</summary>
public sealed record NoteDetailDto(
    Guid Id,
    string Title,
    Guid? FolderId,
    JsonElement ContentJson,
    DateTime CreatedAt,
    DateTime UpdatedAt);
