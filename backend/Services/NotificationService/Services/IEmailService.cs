namespace NotificationService.Services;

/// <summary>
/// Abstraction over email delivery (backed by MailKit/SMTP).
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends a plain-text email to the specified recipient.
    /// </summary>
    Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default);
}
