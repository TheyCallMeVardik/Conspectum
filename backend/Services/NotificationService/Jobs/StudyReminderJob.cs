using System.Text.Json;
using NotificationService.Services;
using Quartz;

namespace NotificationService.Jobs;

[DisallowConcurrentExecution]
public sealed class StudyReminderJob(
    IHttpClientFactory httpClientFactory,
    IEmailService emailService,
    IConfiguration config,
    ILogger<StudyReminderJob> logger) : IJob
{
    private static readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public async Task Execute(IJobExecutionContext context)
    {
        var ct = context.CancellationToken;

        var contentBase = config["Services:ContentService"]
            ?? throw new InvalidOperationException("Services:ContentService is not configured.");
        var authBase = config["Services:AuthService"]
            ?? throw new InvalidOperationException("Services:AuthService is not configured.");

        var http = httpClientFactory.CreateClient("internal");

        // Fetch tasks whose deadline falls in a 5-minute window ending at exactly 24 h from now.
        // The job runs every 5 minutes, so each task enters this window exactly once — no duplicates.
        List<UpcomingTaskDto> tasks;
        try
        {
            var response = await http.GetAsync(
                $"{contentBase}/internal/tasks/upcoming-deadlines?hoursAhead=24", ct);
            response.EnsureSuccessStatusCode();
            var all = await response.Content.ReadFromJsonAsync<List<UpcomingTaskDto>>(_json, ct) ?? [];

            var windowEnd   = DateTime.UtcNow.AddHours(24);
            var windowStart = windowEnd.AddMinutes(-5);
            tasks = all.Where(t => t.Deadline.HasValue
                                && t.Deadline.Value >= windowStart
                                && t.Deadline.Value <= windowEnd).ToList();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch upcoming deadlines from ContentService.");
            return;
        }

        if (tasks.Count == 0) return;

        var byUser = tasks.GroupBy(t => t.UserId);

        foreach (var group in byUser)
        {
            var userId = group.Key;

            string email;
            try
            {
                var res = await http.GetAsync($"{authBase}/internal/users/{userId}/email", ct);
                if (!res.IsSuccessStatusCode) continue;
                var payload = await res.Content.ReadFromJsonAsync<UserEmailDto>(_json, ct);
                email = payload?.Email ?? "";
                if (string.IsNullOrEmpty(email)) continue;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to fetch email for user {UserId}.", userId);
                continue;
            }

            foreach (var task in group)
            {
                try
                {
                    var html = BuildReminderHtml(task.Title, task.Deadline!.Value);
                    await emailService.SendAsync(
                        email,
                        $"⏰ До дедлайна 24 часа: «{task.Title}»",
                        html,
                        ct);
                    logger.LogInformation("Reminder sent to {Email} for task '{Title}'.", email, task.Title);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to send reminder for task {TaskId}.", task.TaskId);
                }
            }
        }
    }

    private static string BuildReminderHtml(string taskTitle, DateTime deadline)
    {
        var deadlineLocal = deadline.ToLocalTime();
        var formattedDeadline = deadlineLocal.ToString("d MMMM yyyy, HH:mm",
            new System.Globalization.CultureInfo("ru-RU"));

        return $"""
            <!DOCTYPE html>
            <html lang="ru">
            <head><meta charset="UTF-8"/></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0"
                    style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

                    <tr>
                      <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
                        <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Конспектум</div>
                        <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Напоминание о задаче</div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:40px;">

                        <p style="margin:0 0 6px;font-size:28px;">⏰</p>
                        <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">
                          До дедлайна осталось 24 часа
                        </h1>
                        <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                          Не забудь завершить задачу вовремя. Ещё есть время — действуй сейчас!
                        </p>

                        <div style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                          <div style="font-size:12px;color:#7c3aed;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Задача</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">{System.Web.HttpUtility.HtmlEncode(taskTitle)}</div>
                        </div>

                        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;text-align:center;margin-bottom:32px;">
                          <div style="font-size:12px;color:#c2410c;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Срок выполнения</div>
                          <div style="font-size:17px;font-weight:700;color:#9a3412;">{formattedDeadline}</div>
                        </div>

                        <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                          Это автоматическое уведомление от Конспектума.<br/>
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

    private sealed record UpcomingTaskDto(Guid UserId, Guid TaskId, string Title, DateTime? Deadline);
    private sealed record UserEmailDto(string Email);
}
