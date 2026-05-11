using ContentService.Search;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;

namespace ContentService.Services;

/// <summary>
/// Elasticsearch implementation of <see cref="ISearchService"/> using the official .NET client.
/// </summary>
public sealed class SearchService(ElasticsearchClient esClient, ILogger<SearchService> logger)
    : ISearchService
{
    private const string IndexName = "notes";

    /// <inheritdoc />
    public async Task IndexNoteAsync(NoteSearchDocument document, CancellationToken ct = default)
    {
        var response = await esClient.IndexAsync(document, i => i
            .Index(IndexName)
            .Id(document.Id.ToString()), ct);

        if (!response.IsValidResponse)
            logger.LogWarning("Failed to index note {NoteId}: {Error}",
                document.Id, response.ElasticsearchServerError?.Error?.Reason);
    }

    /// <inheritdoc />
    public async Task DeleteNoteAsync(Guid noteId, CancellationToken ct = default)
    {
        var response = await esClient.DeleteAsync<NoteSearchDocument>(
            noteId.ToString(), d => d.Index(IndexName), ct);
        if (!response.IsValidResponse && response.Result != Result.NotFound)
            logger.LogWarning("Failed to delete note {NoteId} from index.", noteId);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<NoteSearchDocument>> SearchAsync(
        Guid userId, string query, CancellationToken ct = default)
    {
        var response = await esClient.SearchAsync<NoteSearchDocument>(s => s
            .Index(IndexName)
            .Query(q => q
                .Bool(b => b
                    .Must(
                        m => m.Term(t => t.Field(new Field("userId.keyword")).Value(userId.ToString())),
                        m => m.MultiMatch(mm => mm
                            .Query(query)
                            .Fields(new[] { "title^3", "plainText" })
                            .Fuzziness(new Fuzziness("AUTO")))
                    )
                )
            )
            .Size(50), ct);

        if (!response.IsValidResponse)
        {
            logger.LogWarning("Search query failed: {Error}",
                response.ElasticsearchServerError?.Error?.Reason);
            return [];
        }

        return response.Documents.ToList();
    }
}
