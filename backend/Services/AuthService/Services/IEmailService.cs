namespace AuthService.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string code, CancellationToken ct = default);
    Task SendPasswordResetEmailAsync(string toEmail, string code, CancellationToken ct = default);
}
