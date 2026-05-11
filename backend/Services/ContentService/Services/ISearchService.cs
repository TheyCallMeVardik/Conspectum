using ContentService.Search;

namespace ContentService.Services;

/// <summary>
/// Abstraction over Elasticsearch note indexing and searching.
/// </summary>
public interface ISearchService
{
    /// <summary>
    /// Indexes or updates a note document in Elasticsearch.
    /// Called after every note create/update.
    /// </summary>
    Task IndexNoteAsync(NoteSearchDocument document, CancellationToken ct = default);

    /// <summary>
    /// Removes a note from the search index.
    /// Called after note deletion.
    /// </summary>
    Task DeleteNoteAsync(Guid noteId, CancellationToken ct = default);

    /// <summary>
    /// Performs a full-text search over the user's notes.
    /// </summary>
    /// <param name="userId">Scopes results to the authenticated user.</param>
    /// <param name="query">The free-text query string.</param>
    /// <returns>Matching note documents ordered by relevance score.</returns>
    Task<IReadOnlyList<NoteSearchDocument>> SearchAsync(
        Guid userId, string query, CancellationToken ct = default);
}
