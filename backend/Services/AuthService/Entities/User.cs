namespace AuthService.Entities;

/// <summary>
/// Represents a registered platform user.
/// </summary>
public sealed class User
{
    /// <summary>Gets or sets the primary key.</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Gets or sets the user's email address (unique).</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Gets or sets the BCrypt hash of the user's password.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Gets or sets the UTC timestamp when the account was created.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Whether the user has confirmed their email address.</summary>
    public bool IsEmailVerified { get; set; } = false;

    /// <summary>One-time 6-digit code sent to the user's email on registration.</summary>
    public string? EmailVerificationCode { get; set; }

    /// <summary>UTC expiry of the verification code (15 minutes after issue).</summary>
    public DateTime? EmailVerificationCodeExpiry { get; set; }

    /// <summary>One-time 6-digit code for password reset.</summary>
    public string? PasswordResetCode { get; set; }

    /// <summary>UTC expiry of the password reset code (15 minutes after issue).</summary>
    public DateTime? PasswordResetCodeExpiry { get; set; }

    /// <summary>Navigation property – refresh tokens issued to this user.</summary>
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
