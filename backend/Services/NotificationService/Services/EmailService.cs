using System.Text;
using System.Text.Json;

namespace NotificationService.Services;

public sealed class EmailService(IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<EmailService> logger)
    : IEmailService
{
    private static readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    private readonly string _apiKey = config["Brevo:ApiKey"]
        ?? throw new InvalidOperationException("Brevo:ApiKey is not configured.");
    private readonly string _from = config["Brevo:From"] ?? "noreply@konspektum.ru";
    private readonly string _displayName = config["Brevo:DisplayName"] ?? "Конспектум";

    public async Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        var payload = new
        {
            sender = new { name = _displayName, email = _from },
            to = new[] { new { email = toEmail } },
            subject,
            htmlContent = body,
        };

        var http = httpClientFactory.CreateClient("brevo");
        http.DefaultRequestHeaders.Add("api-key", _apiKey);

        var content = new StringContent(JsonSerializer.Serialize(payload, _json), Encoding.UTF8, "application/json");

        try
        {
            var response = await http.PostAsync("https://api.brevo.com/v3/smtp/email", content, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Brevo API error {Status}: {Body}", response.StatusCode, responseBody);
                return;
            }
            logger.LogInformation("Email sent to {Email} via Brevo.", toEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}.", toEmail);
        }
    }

    public static string BuildDeadlineReminderHtml(string taskTitle, DateTime deadline)
    {
        var timeLeft = deadline - DateTime.UtcNow;
        var timeLeftStr = timeLeft.TotalHours < 1
            ? $"{(int)timeLeft.TotalMinutes} мин."
            : $"{(int)timeLeft.TotalHours} ч.";

        return $"""
            <!DOCTYPE html>
            <html lang="ru">
            <head><meta charset="UTF-8"/></head>
            <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    <tr>
                      <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
                        <p style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Конспектум</p>
                        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Напоминание о дедлайне</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <p style="margin:0 0 16px;font-size:16px;color:#374151;">Срок выполнения задачи подходит к концу!</p>
                        <div style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
                          <p style="margin:0 0 8px;font-size:13px;color:#7c3aed;font-weight:600;text-transform:uppercase;">Задача</p>
                          <p style="margin:0;font-size:20px;font-weight:700;color:#1f2937;">{System.Web.HttpUtility.HtmlEncode(taskTitle)}</p>
                        </div>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="50%" style="padding-right:8px;">
                              <div style="background:#fff7ed;border-radius:8px;padding:16px;text-align:center;">
                                <p style="margin:0 0 4px;font-size:12px;color:#ea580c;font-weight:600;text-transform:uppercase;">Дедлайн</p>
                                <p style="margin:0;font-size:15px;font-weight:700;color:#1f2937;">{deadline.ToLocalTime():dd.MM.yyyy HH:mm}</p>
                              </div>
                            </td>
                            <td width="50%" style="padding-left:8px;">
                              <div style="background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
                                <p style="margin:0 0 4px;font-size:12px;color:#dc2626;font-weight:600;text-transform:uppercase;">Осталось</p>
                                <p style="margin:0;font-size:15px;font-weight:700;color:#1f2937;">{timeLeftStr}</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;text-align:center;">Это автоматическое уведомление от Конспектума.</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }
}
