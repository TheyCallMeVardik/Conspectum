using System.Text;
using System.Text.Json.Serialization;
using ContentService.Data;
using ContentService.DTOs;
using ContentService.Repositories;
using ContentService.Services;
using ContentService.Validators;
using Elastic.Clients.Elasticsearch;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<ContentDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Elasticsearch ─────────────────────────────────────────────────────────────
var esUrl = builder.Configuration["Elasticsearch:Url"]
    ?? throw new InvalidOperationException("Elasticsearch:Url is required.");
builder.Services.AddSingleton(new ElasticsearchClient(new Uri(esUrl)));

// ── Repositories ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<INoteRepository, NoteRepository>();
builder.Services.AddScoped<IQuizRepository, QuizRepository>();
builder.Services.AddScoped<IQuizFolderRepository, QuizFolderRepository>();
builder.Services.AddScoped<IFolderRepository, FolderRepository>();
builder.Services.AddScoped<ILearningTaskRepository, LearningTaskRepository>();

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddScoped<INoteService, NoteService>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<IQuizFolderService, QuizFolderService>();
builder.Services.AddScoped<IFolderService, FolderService>();
builder.Services.AddScoped<ILearningTaskService, LearningTaskService>();
builder.Services.AddHostedService<DeadlineReminderService>();
builder.Services.AddHttpClient();

// ── Validation ────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IValidator<UpsertNoteRequest>, UpsertNoteRequestValidator>();
builder.Services.AddScoped<IValidator<CreateQuizRequest>, CreateQuizRequestValidator>();

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
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var app = builder.Build();

// ── Auto-migrate on startup ───────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ContentDbContext>();
    db.Database.Migrate();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
