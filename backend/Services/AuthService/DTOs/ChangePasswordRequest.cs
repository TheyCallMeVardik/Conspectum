namespace AuthService.DTOs;

/// <summary>Payload for changing the authenticated user's password.</summary>
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
