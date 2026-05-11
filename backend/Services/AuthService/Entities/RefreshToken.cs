namespace AuthService.Entities;

/// <summary>
/// Represents a durable refresh token tied to a <see cref="User"/>.
/// </summary>
public sealed class RefreshToken
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the foreign key referencing the owning user.</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the opaque token string stored in the HttpOnly cookie.</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>Gets or sets the UTC expiry timestamp.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>Gets or sets a value indicating whether this token has been revoked.</summary>
    public bool IsRevoked { get; set; }

    /// <summary>Navigation property – the owning user.</summary>
    public User User { get; set; } = null!;

    /// <summary>Returns <c>true</c> when the token is neither expired nor revoked.</summary>
    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
}
