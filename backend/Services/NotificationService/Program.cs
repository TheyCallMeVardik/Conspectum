using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NotificationService.Consumers;
using NotificationService.Data;
using NotificationService.Jobs;
using NotificationService.Repositories;
using NotificationService.Services;
using Quartz;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<NotificationDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Repositories ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddSingleton<WebSocketHub>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHttpClient("internal");
builder.Services.AddHttpClient("brevo");

// ── Kafka consumer (background service) ───────────────────────────────────────
builder.Services.AddHostedService<NotificationKafkaConsumer>();

// ── Quartz.NET scheduler ──────────────────────────────────────────────────────
builder.Services.AddQuartz(q =>
{
    var jobKey = new JobKey("StudyReminderJob");

    q.AddJob<StudyReminderJob>(opts => opts.WithIdentity(jobKey));

    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("StudyReminderTrigger")
        // Fires every 5 minutes
        .WithCronSchedule("0 0/5 * * * ?"));
});
builder.Services.AddQuartzHostedService(opts => opts.WaitForJobsToComplete = true);

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is required.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero,
        };
        // Support JWT from WebSocket query-string
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token))
                    ctx.Token = token;
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

WebApplication app;
try
{
    app = builder.Build();
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[FATAL] Build failed: {ex}");
    throw;
}

// ── Auto-migrate on startup ───────────────────────────────────────────────────
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    db.Database.Migrate();
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[FATAL] Migration failed: {ex}");
    throw;
}

app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

try
{
    app.Run();
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[FATAL] Run failed: {ex}");
    throw;
}
