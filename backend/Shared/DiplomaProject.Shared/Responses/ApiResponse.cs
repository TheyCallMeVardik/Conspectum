namespace DiplomaProject.Shared.Responses;

/// <summary>
/// Generic envelope for all API responses.
/// </summary>
public sealed class ApiResponse<T>
{
    /// <summary>Gets a value indicating whether the request succeeded.</summary>
    public bool Success { get; init; }

    /// <summary>Gets the response payload, present when <see cref="Success"/> is <c>true</c>.</summary>
    public T? Data { get; init; }

    /// <summary>Gets the error message, present when <see cref="Success"/> is <c>false</c>.</summary>
    public string? Error { get; init; }

    /// <summary>Gets validation errors keyed by field name.</summary>
    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    /// <summary>Creates a successful response wrapping the given data.</summary>
    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };

    /// <summary>Creates a failed response with the given error message.</summary>
    public static ApiResponse<T> Fail(string error) => new() { Success = false, Error = error };

    /// <summary>Creates a validation-failed response.</summary>
    public static ApiResponse<T> ValidationFail(IDictionary<string, string[]> errors) =>
        new() { Success = false, Error = "Validation failed.", ValidationErrors = errors };
}
