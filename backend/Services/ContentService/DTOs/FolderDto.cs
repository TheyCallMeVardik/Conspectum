namespace ContentService.DTOs;

/// <summary>Payload for creating a folder.</summary>
public sealed record CreateFolderRequest(string Name, string? Description = null);

/// <summary>Payload for renaming a folder.</summary>
public sealed record RenameFolderRequest(string Name, string? Description = null);

/// <summary>Folder summary returned in list and create responses.</summary>
public sealed record FolderDto(Guid Id, string Name, string? Description, DateTime CreatedAt, int NoteCount);
