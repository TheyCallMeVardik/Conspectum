using System.Text.Json;
using Confluent.Kafka;
using NotificationService.DTOs;
using NotificationService.Entities;
using NotificationService.Repositories;
using NotificationService.Services;

namespace NotificationService.Consumers;

/// <summary>
/// Background service that consumes messages from the <c>notification.schedule</c>
/// Kafka topic and delivers them via WebSocket push and email.
/// </summary>
public sealed class NotificationKafkaConsumer(
    IConfiguration config,
    IServiceScopeFactory scopeFactory,
    WebSocketHub wsHub,
    ILogger<NotificationKafkaConsumer> logger) : BackgroundService
{
    private const string Topic = "notification.schedule";

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var bootstrapServers = config["Kafka:BootstrapServers"] ?? "localhost:9092";

        var consumerConfig = new ConsumerConfig
        {
            BootstrapServers = bootstrapServers,
            GroupId = "notification-service",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false,
        };

        using var consumer = new ConsumerBuilder<string, string>(consumerConfig).Build();
        consumer.Subscribe(Topic);

        logger.LogInformation("Kafka consumer started on topic '{Topic}'.", Topic);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(TimeSpan.FromSeconds(1));
                if (result is null) continue;

                var evt = JsonSerializer.Deserialize<ScheduleNotificationEvent>(result.Message.Value);
                if (evt is null)
                {
                    consumer.Commit(result);
                    continue;
                }

                await DeliverAsync(evt, stoppingToken);
                consumer.Commit(result);
            }
            catch (OperationCanceledException) { break; }
            catch (ConsumeException ex)
            {
                logger.LogError(ex, "Kafka consume error.");
                await Task.Delay(3000, stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unexpected error in notification consumer.");
                await Task.Delay(3000, stoppingToken).ConfigureAwait(false);
            }
        }

        consumer.Close();
    }

    private async Task DeliverAsync(ScheduleNotificationEvent evt, CancellationToken ct)
    {
        // Persist notification
        using var scope = scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<INotificationRepository>();
        var emailSvc = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var notification = new Notification
        {
            UserId = evt.UserId,
            Message = evt.Message,
            ScheduledAt = evt.ScheduledAt,
            SentAt = DateTime.UtcNow,
        };

        await repo.AddAsync(notification, ct);
        await repo.SaveChangesAsync(ct);

        // Push via WebSocket
        await wsHub.SendAsync(evt.UserId, new
        {
            type = "notification",
            id = notification.Id,
            message = notification.Message,
            scheduledAt = notification.ScheduledAt,
        }, ct);

        logger.LogInformation(
            "Delivered notification {Id} to user {UserId}.", notification.Id, evt.UserId);
    }
}
