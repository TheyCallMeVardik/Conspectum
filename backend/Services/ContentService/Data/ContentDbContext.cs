using ContentService.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContentService.Data;

/// <summary>
/// EF Core database context for the ContentService.
/// </summary>
public sealed class ContentDbContext(DbContextOptions<ContentDbContext> options) : DbContext(options)
{
    /// <summary>Gets the notes table.</summary>
    public DbSet<Note> Notes => Set<Note>();

    /// <summary>Gets the note folders table.</summary>
    public DbSet<NoteFolder> NoteFolders => Set<NoteFolder>();

    /// <summary>Gets the learning tasks table.</summary>
    public DbSet<LearningTask> LearningTasks => Set<LearningTask>();

    /// <summary>Gets the quiz folders table.</summary>
    public DbSet<QuizFolder> QuizFolders => Set<QuizFolder>();

    /// <summary>Gets the quizzes table.</summary>
    public DbSet<Quiz> Quizzes => Set<Quiz>();

    /// <summary>Gets the questions table.</summary>
    public DbSet<Question> Questions => Set<Question>();

    /// <summary>Gets the answers table.</summary>
    public DbSet<Answer> Answers => Set<Answer>();

    /// <inheritdoc />
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NoteFolder>(e =>
        {
            e.HasKey(f => f.Id);
            e.HasIndex(f => f.UserId);
            e.Property(f => f.Name).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<Note>(e =>
        {
            e.HasKey(n => n.Id);
            e.HasIndex(n => n.UserId);
            e.Property(n => n.Title).HasMaxLength(512).IsRequired();
            e.Property(n => n.ContentJson)
             .HasColumnType("jsonb")
             .IsRequired();
            e.HasOne(n => n.Folder)
             .WithMany(f => f.Notes)
             .HasForeignKey(n => n.FolderId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<LearningTask>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => t.UserId);
            e.Property(t => t.Title).HasMaxLength(512).IsRequired();
            e.Property(t => t.DescriptionJson).HasColumnType("jsonb");
            e.Property(t => t.Status).HasConversion<string>();
            e.Property(t => t.MaterialType).HasConversion<string>();
        });

        modelBuilder.Entity<QuizFolder>(e =>
        {
            e.HasKey(f => f.Id);
            e.HasIndex(f => f.UserId);
            e.Property(f => f.Name).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<Quiz>(e =>
        {
            e.HasKey(q => q.Id);
            e.HasIndex(q => q.UserId);
            e.Property(q => q.Title).HasMaxLength(512).IsRequired();
            e.HasOne(q => q.Folder)
             .WithMany(f => f.Quizzes)
             .HasForeignKey(q => q.FolderId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Question>(e =>
        {
            e.HasKey(q => q.Id);
            e.Property(q => q.Text).IsRequired();
            e.HasOne(q => q.Quiz)
             .WithMany(quiz => quiz.Questions)
             .HasForeignKey(q => q.QuizId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Answer>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Text).IsRequired();
            e.HasOne(a => a.Question)
             .WithMany(q => q.Answers)
             .HasForeignKey(a => a.QuestionId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
