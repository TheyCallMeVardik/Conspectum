using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ContentService.Repositories;

namespace ContentService.Services;

public sealed class DeadlineReminderService(
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    ILogger<DeadlineReminderService> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        logger.LogInformation("DeadlineReminderService started — checking every 5 minutes.");

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));

        while (await timer.WaitForNextTickAsync(ct))
        {
            try { await SendRemindersAsync(ct); }
            catch (Exception ex) { logger.LogError(ex, "Error in DeadlineReminderService."); }
        }
    }

    private async Task SendRemindersAsync(CancellationToken ct)
    {
        var apiKey = config["Brevo:ApiKey"];
        var fromEmail = config["Brevo:From"] ?? "noreply@konspektum.ru";
        var displayName = config["Brevo:DisplayName"] ?? "Конспектум";
        var authBase = config["Services:AuthService"] ?? "http://localhost:5151";

        if (string.IsNullOrEmpty(apiKey)) { logger.LogWarning("Brevo:ApiKey not configured."); return; }

        // Tasks with deadline in the next 24h window (23h55m → 24h)
        var windowEnd = DateTime.UtcNow.AddHours(24);
        var windowStart = windowEnd.AddMinutes(-5);

        List<Entities.LearningTask> tasks;
        using (var scope = scopeFactory.CreateScope())
        {
            var repo = scope.ServiceProvider.GetRequiredService<ILearningTaskRepository>();
            var upcoming = await repo.GetUpcomingDeadlinesAsync(24, ct);
            tasks = upcoming
                .Where(t => t.Deadline >= windowStart && t.Deadline <= windowEnd)
                .ToList();
        }

        if (tasks.Count == 0) return;

        logger.LogInformation("Found {Count} task(s) to remind about.", tasks.Count);

        var http = httpClientFactory.CreateClient("brevo");
        http.DefaultRequestHeaders.Add("api-key", apiKey);

        foreach (var task in tasks)
        {
            // Get user email from AuthService
            string email;
            try
            {
                var authHttp = httpClientFactory.CreateClient();
                var res = await authHttp.GetAsync($"{authBase}/internal/users/{task.UserId}/email", ct);
                if (!res.IsSuccessStatusCode) continue;
                var payload = await res.Content.ReadFromJsonAsync<UserEmailDto>(_json, ct);
                email = payload?.Email ?? "";
                if (string.IsNullOrEmpty(email)) continue;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to get email for user {UserId}.", task.UserId);
                continue;
            }

            // Send via Brevo
            try
            {
                var deadline = task.Deadline!.Value;
                var html = BuildHtml(task.Title, deadline);
                var payload = new
                {
                    sender = new { name = displayName, email = fromEmail },
                    to = new[] { new { email } },
                    subject = $"⏰ До дедлайна 24 часа: «{task.Title}»",
                    htmlContent = html,
                };
                var content = new StringContent(
                    JsonSerializer.Serialize(payload, _json), Encoding.UTF8, "application/json");
                var response = await http.PostAsync("https://api.brevo.com/v3/smtp/email", content, ct);
                var body = await response.Content.ReadAsStringAsync(ct);
                if (response.IsSuccessStatusCode)
                    logger.LogInformation("Reminder sent to {Email} for task '{Title}'.", email, task.Title);
                else
                    logger.LogError("Brevo error {Status}: {Body}", response.StatusCode, body);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send reminder for task {TaskId}.", task.Id);
            }
        }
    }

    private static string BuildHtml(string title, DateTime deadline)
    {
        var formatted = deadline.ToLocalTime().ToString("d MMMM yyyy, HH:mm", new CultureInfo("ru-RU"));
        return $"""
            <!DOCTYPE html>
            <html lang="ru">
            <head><meta charset="UTF-8"/></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
                        <div style="color:#fff;font-size:22px;font-weight:800;">Конспектум</div>
                        <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Напоминание о задаче</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <p style="margin:0 0 6px;font-size:28px;">⏰</p>
                        <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">До дедлайна осталось 24 часа</h1>
                        <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                          Не забудь завершить задачу вовремя. Ещё есть время — действуй сейчас!
                        </p>
                        <div style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                          <div style="font-size:12px;color:#7c3aed;font-weight:600;text-transform:uppercase;margin-bottom:6px;">Задача</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">{System.Web.HttpUtility.HtmlEncode(title)}</div>
                        </div>
                        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;text-align:center;margin-bottom:32px;">
                          <div style="font-size:12px;color:#c2410c;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Срок выполнения</div>
                          <div style="font-size:17px;font-weight:700;color:#9a3412;">{formatted}</div>
                        </div>
                        <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                          Автоматическое уведомление от Конспектума.<br/>
                          Если задача уже выполнена — просто проигнорируй это письмо.
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

    private sealed record UserEmailDto(string Email);
}
