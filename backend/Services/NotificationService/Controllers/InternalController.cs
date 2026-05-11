using Microsoft.AspNetCore.Mvc;
using NotificationService.Jobs;
using Quartz;

namespace NotificationService.Controllers;

[ApiController]
[Route("internal")]
public sealed class InternalController(ISchedulerFactory schedulerFactory) : ControllerBase
{
    /// <summary>Manually triggers the StudyReminderJob for testing.</summary>
    [HttpPost("trigger-reminders")]
    public async Task<IActionResult> TriggerReminders(CancellationToken ct)
    {
        var scheduler = await schedulerFactory.GetScheduler(ct);
        await scheduler.TriggerJob(new JobKey("StudyReminderJob"), ct);
        return Ok(new { message = "StudyReminderJob triggered." });
    }
}
