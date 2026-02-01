using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Application.Commands;

/// <summary>
/// Base interface for command handlers that process realm commands.
/// </summary>
/// <typeparam name="TRequest">The command request type</typeparam>
public interface ICommandHandler<TRequest>
{
    /// <summary>
    /// Handles the command and returns a result.
    /// </summary>
    Task<CommandResultDto> HandleAsync(TRequest request, CancellationToken cancellationToken = default);
}

/// <summary>
/// Base interface for command handlers that return a typed result.
/// </summary>
/// <typeparam name="TRequest">The command request type</typeparam>
/// <typeparam name="TResult">The result type</typeparam>
public interface ICommandHandler<TRequest, TResult>
{
    /// <summary>
    /// Handles the command and returns a typed result.
    /// </summary>
    Task<TResult> HandleAsync(TRequest request, CancellationToken cancellationToken = default);
}

/// <summary>
/// Context for executing commands within a realm.
/// </summary>
public record RealmCommandContext(Guid MemberId, Guid RealmId, string ClientId);
