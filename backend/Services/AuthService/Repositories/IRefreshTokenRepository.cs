using AuthService.Entities;

namespace AuthService.Repositories;

/// <summary>
/// Abstraction over refresh-token persistence operations.
/// </summary>
public interface IRefreshTokenRepository
{
    /// <summary>Finds an active (non-expired, non-revoked) refresh token by its opaque value.</summary>
    Task<RefreshToken?> GetActiveAsync(string token, CancellationToken ct = default);

    /// <summary>Persists a new refresh token.</summary>
    Task AddAsync(RefreshToken token, CancellationToken ct = default);

    /// <summary>Revokes all active refresh tokens belonging to a user (logout all devices).</summary>
    Task RevokeAllForUserAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Commits pending changes to the database.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);
}
