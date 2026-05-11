using AuthService.DTOs;
using AuthService.Repositories;
using AuthService.Services;
using DiplomaProject.Shared.Extensions;
using DiplomaProject.Shared.Responses;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IAuthService authService,
    IUserRepository userRepository,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator,
    IWebHostEnvironment env) : ControllerBase
{
    private const string RefreshTokenCookieName = "refreshToken";

    // ── Registration & email verification ─────────────────────────────────────

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var validation = await registerValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.ValidationFail(validation.ToDictionary()));

        try
        {
            var email = await authService.RegisterAsync(request, ct);
            return StatusCode(StatusCodes.Status201Created,
                ApiResponse<object>.Ok(new { email, message = "Verification code sent to your email." }));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length != 6)
            return BadRequest(ApiResponse<object>.Fail("Code must be 6 digits."));

        try
        {
            var (response, refreshToken) = await authService.VerifyEmailAsync(request.Code, ct);
            SetRefreshCookie(refreshToken, response.AccessTokenExpiry.AddDays(7));
            return Ok(ApiResponse<AuthResponse>.Ok(response));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification(
        [FromBody] ResendVerificationRequest request, CancellationToken ct)
    {
        await authService.ResendVerificationAsync(request.Email, ct);
        return Ok(ApiResponse<object>.Ok(new { message = "If the email exists and is unverified, a new code was sent." }));
    }

    // ── Password reset ────────────────────────────────────────────────────────

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        await authService.ForgotPasswordAsync(request.Email, ct);
        return Ok(ApiResponse<object>.Ok(new { message = "If the account exists, a reset code was sent." }));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        try
        {
            await authService.ResetPasswordAsync(request.Email, request.Code, request.NewPassword, ct);
            return Ok(ApiResponse<object>.Ok(new { message = "Password reset successfully." }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var validation = await loginValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.ValidationFail(validation.ToDictionary()));

        try
        {
            var (response, refreshToken) = await authService.LoginAsync(request, ct);
            SetRefreshCookie(refreshToken, response.AccessTokenExpiry.AddDays(7));
            return Ok(ApiResponse<AuthResponse>.Ok(response));
        }
        catch (EmailNotVerifiedException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new { success = false, error = "email_not_verified", email = ex.Email });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<object>.Fail(ex.Message));
        }
    }

    // ── Token management ──────────────────────────────────────────────────────

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        if (string.IsNullOrWhiteSpace(refreshToken))
            return Unauthorized(ApiResponse<object>.Fail("Refresh token is missing."));

        try
        {
            var (response, newRefreshToken) = await authService.RefreshAsync(refreshToken, ct);
            SetRefreshCookie(newRefreshToken, response.AccessTokenExpiry.AddDays(7));
            return Ok(ApiResponse<AuthResponse>.Ok(response));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await authService.LogoutAsync(User.GetUserId(), ct);
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions { Path = "/api/auth" });
        return NoContent();
    }

    [HttpPut("password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            request.NewPassword.Length < 6)
            return BadRequest(ApiResponse<object>.Fail("New password must be at least 6 characters."));

        try
        {
            await authService.ChangePasswordAsync(User.GetUserId(), request.CurrentPassword, request.NewPassword, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("account")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount(CancellationToken ct)
    {
        await authService.DeleteAccountAsync(User.GetUserId(), ct);
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions { Path = "/api/auth" });
        return NoContent();
    }

    // ── Internal service-to-service endpoint ─────────────────────────────────

    [HttpGet("/internal/users/{id:guid}/email")]
    public async Task<IActionResult> GetUserEmail(Guid id, CancellationToken ct)
    {
        var user = await userRepository.GetByIdAsync(id, ct);
        if (user is null) return NotFound();
        return Ok(new { email = user.Email });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void SetRefreshCookie(string token, DateTime expiry)
    {
        var isProduction = env.IsProduction();
        Response.Cookies.Append(RefreshTokenCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = isProduction ? SameSiteMode.Strict : SameSiteMode.Lax,
            Path = "/api/auth",
            Expires = expiry,
        });
    }
}
