using AuthService.Entities;

namespace AuthService.Services;

/// <summary>
/// Creates and validates JWT access tokens and opaque refresh tokens.
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Generates a signed JWT access token for the given user.
    /// </summary>
    /// <returns>The encoded token string and its expiry timestamp.</returns>
    (string token, DateTime expiry) GenerateAccessToken(User user);

    /// <summary>
    /// Generates a cryptographically random refresh token and persists it.
    /// </summary>
    Task<RefreshToken> GenerateRefreshTokenAsync(User user, CancellationToken ct = default);
}
