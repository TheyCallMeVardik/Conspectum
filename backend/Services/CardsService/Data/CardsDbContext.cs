using CardsService.Entities;
using Microsoft.EntityFrameworkCore;

namespace CardsService.Data;

/// <summary>
/// EF Core database context for the CardsService.
/// </summary>
public sealed class CardsDbContext(DbContextOptions<CardsDbContext> options) : DbContext(options)
{
    /// <summary>Gets the flashcards table.</summary>
    public DbSet<Flashcard> Flashcards => Set<Flashcard>();

    /// <summary>Gets the decks table.</summary>
    public DbSet<Deck> Decks => Set<Deck>();

    /// <inheritdoc />
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Flashcard>(e =>
        {
            e.HasKey(f => f.Id);
            e.HasIndex(f => f.UserId);
            e.HasIndex(f => new { f.UserId, f.NextReview });
            e.Property(f => f.Front).IsRequired();
            e.Property(f => f.Back).IsRequired();
            e.Property(f => f.EaseFactor).HasDefaultValue(2.5);
            e.HasOne(f => f.Deck)
             .WithMany(d => d.Flashcards)
             .HasForeignKey(f => f.DeckId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Deck>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasIndex(d => d.UserId);
            e.Property(d => d.Name).IsRequired().HasMaxLength(200);
            e.Property(d => d.Description).HasMaxLength(1000);
        });
    }
}
