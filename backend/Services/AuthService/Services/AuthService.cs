using AuthService.DTOs;
using AuthService.Entities;
using AuthService.Repositories;
using BC = BCrypt.Net.BCrypt;

namespace AuthService.Services;

public sealed class AuthService(
    IUserRepository userRepo,
    IRefreshTokenRepository refreshTokenRepo,
    ITokenService tokenService,
    IEmailService emailService) : IAuthService
{
    private static string GenerateCode() =>
        Random.Shared.Next(100_000, 1_000_000).ToString();

    /// <inheritdoc />
    public async Task<string> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var existing = await userRepo.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            throw new InvalidOperationException("An account with this email already exists.");

        var code = GenerateCode();
        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BC.HashPassword(request.Password),
            IsEmailVerified = false,
            EmailVerificationCode = code,
            EmailVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15),
        };

        await userRepo.AddAsync(user, ct);
        await userRepo.SaveChangesAsync(ct);

        await emailService.SendVerificationEmailAsync(user.Email, code, ct);

        return user.Email;
    }

    /// <inheritdoc />
    public async Task<(AuthResponse response, string refreshToken)> VerifyEmailAsync(
        string code, CancellationToken ct = default)
    {
        var user = await userRepo.GetByVerificationCodeAsync(code, ct)
            ?? throw new InvalidOperationException("Verification code is invalid or has expired.");

        user.IsEmailVerified = true;
        user.EmailVerificationCode = null;
        user.EmailVerificationCodeExpiry = null;
        await userRepo.SaveChangesAsync(ct);

        return await BuildTokenPairAsync(user, ct);
    }

    /// <inheritdoc />
    public async Task ResendVerificationAsync(string email, CancellationToken ct = default)
    {
        var user = await userRepo.GetByEmailAsync(email, ct);
        if (user is null || user.IsEmailVerified) return;

        var code = GenerateCode();
        user.EmailVerificationCode = code;
        user.EmailVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        await userRepo.SaveChangesAsync(ct);

        await emailService.SendVerificationEmailAsync(user.Email, code, ct);
    }

    /// <inheritdoc />
    public async Task<(AuthResponse response, string refreshToken)> LoginAsync(
        LoginRequest request, CancellationToken ct = default)
    {
        var user = await userRepo.GetByEmailAsync(request.Email, ct);
        if (user is null || !BC.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsEmailVerified)
            throw new EmailNotVerifiedException(user.Email);

        return await BuildTokenPairAsync(user, ct);
    }

    /// <inheritdoc />
    public async Task<(AuthResponse response, string refreshToken)> RefreshAsync(
        string refreshToken, CancellationToken ct = default)
    {
        var stored = await refreshTokenRepo.GetActiveAsync(refreshToken, ct)
            ?? throw new UnauthorizedAccessException("Refresh token is invalid or has expired.");

        stored.IsRevoked = true;
        await refreshTokenRepo.SaveChangesAsync(ct);

        return await BuildTokenPairAsync(stored.User, ct);
    }

    /// <inheritdoc />
    public Task LogoutAsync(Guid userId, CancellationToken ct = default) =>
        refreshTokenRepo.RevokeAllForUserAsync(userId, ct);

    /// <inheritdoc />
    public async Task ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        var user = await userRepo.GetByEmailAsync(email, ct);
        if (user is null || !user.IsEmailVerified) return; // silently ignore

        var code = GenerateCode();
        user.PasswordResetCode = code;
        user.PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        await userRepo.SaveChangesAsync(ct);

        await emailService.SendPasswordResetEmailAsync(user.Email, code, ct);
    }

    /// <inheritdoc />
    public async Task ResetPasswordAsync(string email, string code, string newPassword, CancellationToken ct = default)
    {
        var user = await userRepo.GetByEmailAsync(email, ct)
            ?? throw new InvalidOperationException("Invalid or expired reset code.");

        if (user.PasswordResetCode != code || user.PasswordResetCodeExpiry <= DateTime.UtcNow)
            throw new InvalidOperationException("Invalid or expired reset code.");

        user.PasswordHash = BC.HashPassword(newPassword);
        user.PasswordResetCode = null;
        user.PasswordResetCodeExpiry = null;
        await userRepo.SaveChangesAsync(ct);
    }

    /// <inheritdoc />
    public async Task ChangePasswordAsync(
        Guid userId, string currentPassword, string newPassword, CancellationToken ct = default)
    {
        var user = await userRepo.GetByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");
        if (!BC.Verify(currentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect.");
        user.PasswordHash = BC.HashPassword(newPassword);
        await userRepo.SaveChangesAsync(ct);
    }

    /// <inheritdoc />
    public async Task DeleteAccountAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await userRepo.GetByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");
        await refreshTokenRepo.RevokeAllForUserAsync(userId, ct);
        userRepo.Remove(user);
        await userRepo.SaveChangesAsync(ct);
    }

    private async Task<(AuthResponse, string)> BuildTokenPairAsync(User user, CancellationToken ct)
    {
        var (accessToken, expiry) = tokenService.GenerateAccessToken(user);
        var rt = await tokenService.GenerateRefreshTokenAsync(user, ct);
        return (new AuthResponse(accessToken, expiry, user.Id, user.Email), rt.Token);
    }
}
