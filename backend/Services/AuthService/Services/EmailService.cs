using System.Text;
using System.Text.Json;

namespace AuthService.Services;

public sealed class EmailService(IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<EmailService> logger) : IEmailService
{
    private static readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public async Task SendVerificationEmailAsync(string toEmail, string code, CancellationToken ct = default)
    {
        var apiKey = config["Brevo:ApiKey"]
            ?? throw new InvalidOperationException("Brevo:ApiKey is not configured.");
        var fromEmail = config["Brevo:From"] ?? "noreply@konspektum.ru";
        var displayName = config["Brevo:DisplayName"] ?? "Конспектум";

        var payload = new
        {
            sender = new { name = displayName, email = fromEmail },
            to = new[] { new { email = toEmail } },
            subject = "Подтверждение email — Конспектум",
            htmlContent = BuildHtml(code),
        };

        var http = httpClientFactory.CreateClient("brevo");
        http.DefaultRequestHeaders.Add("api-key", apiKey);

        var content = new StringContent(JsonSerializer.Serialize(payload, _json), Encoding.UTF8, "application/json");

        try
        {
            var response = await http.PostAsync("https://api.brevo.com/v3/smtp/email", content, ct);
            var body = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Brevo API error {Status}: {Body}", response.StatusCode, body);
                throw new InvalidOperationException($"Failed to send email: {body}");
            }
            logger.LogInformation("Verification email sent to {Email} via Brevo.", toEmail);
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            logger.LogError(ex, "Failed to send verification email to {Email}.", toEmail);
            throw;
        }
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string code, CancellationToken ct = default)
    {
        var apiKey = config["Brevo:ApiKey"] ?? throw new InvalidOperationException("Brevo:ApiKey is not configured.");
        var from = config["Brevo:From"] ?? "onboarding@resend.dev";
        var displayName = config["Brevo:DisplayName"] ?? "Конспектум";

        var payload = new
        {
            sender = new { name = displayName, email = from },
            to = new[] { new { email = toEmail } },
            subject = "Сброс пароля — Конспектум",
            htmlContent = BuildResetHtml(code),
        };

        var http = httpClientFactory.CreateClient("brevo");
        http.DefaultRequestHeaders.Add("api-key", apiKey);
        var content = new StringContent(JsonSerializer.Serialize(payload, _json), Encoding.UTF8, "application/json");
        var response = await http.PostAsync("https://api.brevo.com/v3/smtp/email", content, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            logger.LogError("Brevo error {Status}: {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Failed to send email: {body}");
        }
    }

    private static string BuildResetHtml(string code) => $"""
        <!DOCTYPE html>
        <html lang="ru">
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0D0D0D,#404040);padding:32px 40px;text-align:center;">
                    <div style="color:#ffffff;font-size:20px;font-weight:700;">Конспектум</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Сброс пароля</h1>
                    <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.6;">
                      Введите этот код для установки нового пароля. Код действителен <strong>15 минут</strong>.
                    </p>
                    <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                      <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#111827;font-family:'Courier New',monospace;">{code}</div>
                    </div>
                    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                      Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 40px;text-align:center;font-size:12px;color:#d1d5db;">
                    © 2025 Конспектум
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    private static string BuildHtml(string code) => $"""
        <!DOCTYPE html>
        <html lang="ru">
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
                    <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Конспектум</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Подтвердите ваш email</h1>
                    <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.6;">
                      Для завершения регистрации введите код ниже. Код действителен <strong>15 минут</strong>.
                    </p>
                    <div style="background:#f5f3ff;border:2px solid #ddd6fe;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                      <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#7c3aed;font-family:'Courier New',monospace;">{code}</div>
                    </div>
                    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                      Если вы не регистрировались на Конспектум — просто проигнорируйте это письмо.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 40px;text-align:center;font-size:12px;color:#d1d5db;">
                    © 2025 Конспектум
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
}
