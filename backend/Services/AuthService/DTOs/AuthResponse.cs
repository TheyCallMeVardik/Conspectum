namespace AuthService.DTOs;

/// <summary>
/// Response returned after a successful authentication operation.
/// The refresh token is set as an HttpOnly cookie by the controller; this DTO
/// carries only the short-lived access token and basic user info.
/// </summary>
public sealed record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiry,
    Guid UserId,
    string Email);
