using AuthService.DTOs;

namespace AuthService.Services;

public interface IAuthService
{
    /// <summary>
    /// Registers a new user, sends a verification email, and returns the email address.
    /// Throws <see cref="InvalidOperationException"/> if the email is already taken.
    /// </summary>
    Task<string> RegisterAsync(RegisterRequest request, CancellationToken ct = default);

    /// <summary>
    /// Verifies the user's email using a one-time code and returns auth tokens.
    /// Throws <see cref="InvalidOperationException"/> if the code is invalid or expired.
    /// </summary>
    Task<(AuthResponse response, string refreshToken)> VerifyEmailAsync(string code, CancellationToken ct = default);

    /// <summary>
    /// Re-sends the verification code to the given email (silently ignores unknown / already-verified emails).
    /// </summary>
    Task ResendVerificationAsync(string email, CancellationToken ct = default);

    /// <summary>
    /// Authenticates a user and returns auth tokens.
    /// Throws <see cref="UnauthorizedAccessException"/> on invalid credentials.
    /// Throws <see cref="EmailNotVerifiedException"/> if the email has not been confirmed.
    /// </summary>
    Task<(AuthResponse response, string refreshToken)> LoginAsync(LoginRequest request, CancellationToken ct = default);

    /// <summary>Rotates the refresh token and issues a new access token.</summary>
    Task<(AuthResponse response, string refreshToken)> RefreshAsync(string refreshToken, CancellationToken ct = default);

    /// <summary>Revokes all refresh tokens for the given user.</summary>
    Task LogoutAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Sends a password-reset code to the email if the account exists.</summary>
    Task ForgotPasswordAsync(string email, CancellationToken ct = default);

    /// <summary>Validates the reset code and sets a new password.</summary>
    Task ResetPasswordAsync(string email, string code, string newPassword, CancellationToken ct = default);

    /// <summary>Changes the password for the given user.</summary>
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default);

    /// <summary>Permanently deletes the user account and all associated data.</summary>
    Task DeleteAccountAsync(Guid userId, CancellationToken ct = default);
}
