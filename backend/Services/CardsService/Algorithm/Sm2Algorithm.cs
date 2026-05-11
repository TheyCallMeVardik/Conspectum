using CardsService.Entities;

namespace CardsService.Algorithm;

/// <summary>
/// Implements the SuperMemo SM-2 spaced repetition algorithm.
/// Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
/// </summary>
public static class Sm2Algorithm
{
    /// <summary>
    /// Updates the SM-2 scheduling fields on a <see cref="Flashcard"/> based on the
    /// user's self-rated quality of recall.
    /// </summary>
    /// <param name="card">The flashcard to update (mutated in place).</param>
    /// <param name="quality">
    /// Quality of response (0–5):
    /// <list type="bullet">
    ///   <item>0 – complete blackout</item>
    ///   <item>1 – incorrect, but upon seeing answer it felt familiar</item>
    ///   <item>2 – incorrect, but easy to recall correct answer</item>
    ///   <item>3 – correct with serious difficulty</item>
    ///   <item>4 – correct with hesitation</item>
    ///   <item>5 – perfect response</item>
    /// </list>
    /// </param>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when quality is outside [0, 5].</exception>
    public static void Apply(Flashcard card, int quality)
    {
        if (quality < 0 || quality > 5)
            throw new ArgumentOutOfRangeException(nameof(quality), "Quality must be between 0 and 5.");

        if (quality >= 3)
        {
            // Successful repetition
            card.Interval = card.Repetitions switch
            {
                0 => 1,
                1 => 6,
                _ => (int)Math.Round(card.Interval * card.EaseFactor),
            };
            card.Repetitions++;
        }
        else
        {
            // Failed: reset the repetition streak; keep interval at 1 day
            card.Repetitions = 0;
            card.Interval = 1;
        }

        // Update ease factor (minimum 1.3 per SM-2 spec)
        card.EaseFactor = Math.Max(
            1.3,
            card.EaseFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        card.NextReview = DateTime.UtcNow.AddDays(card.Interval);
    }
}
