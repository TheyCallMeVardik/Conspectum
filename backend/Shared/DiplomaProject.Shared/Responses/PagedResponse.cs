namespace DiplomaProject.Shared.Responses;

/// <summary>
/// Paginated list wrapper returned by list endpoints.
/// </summary>
public sealed class PagedResponse<T>
{
    /// <summary>Gets the items in the current page.</summary>
    public IReadOnlyList<T> Items { get; init; } = [];

    /// <summary>Gets the total number of items across all pages.</summary>
    public int TotalCount { get; init; }

    /// <summary>Gets the current page number (1-based).</summary>
    public int Page { get; init; }

    /// <summary>Gets the page size.</summary>
    public int PageSize { get; init; }

    /// <summary>Gets the total number of pages.</summary>
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;

    /// <summary>Gets a value indicating whether there is a next page.</summary>
    public bool HasNextPage => Page < TotalPages;

    /// <summary>Gets a value indicating whether there is a previous page.</summary>
    public bool HasPreviousPage => Page > 1;
}
