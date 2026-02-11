using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using PointRealm.Server.Application.Abstractions;

namespace PointRealm.Server.Api.Services;

public sealed class DistributedCommandDeduplicator : ICommandDeduplicator
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly IDistributedCache _cache;
    private readonly int _maxEntries;
    private readonly TimeSpan _window;

    public DistributedCommandDeduplicator(IDistributedCache cache, int maxEntries = 50, TimeSpan? window = null)
    {
        _cache = cache;
        _maxEntries = maxEntries;
        _window = window ?? TimeSpan.FromMinutes(2);
    }

    public bool TryGetResult(Guid memberId, Guid commandId, out object? payload)
    {
        payload = null;

        var history = GetHistory(memberId);
        if (history is null)
        {
            return false;
        }

        var record = history.Records.FirstOrDefault(r => r.CommandId == commandId);
        if (record is null)
        {
            return false;
        }

        payload = DeserializePayload(record);
        _cache.Refresh(GetKey(memberId));
        return true;
    }

    public void StoreResult(Guid memberId, Guid commandId, object? payload)
    {
        var history = GetHistory(memberId) ?? new CommandHistory();
        if (history.Records.Any(r => r.CommandId == commandId))
        {
            return;
        }

        var entry = SerializePayload(commandId, payload);
        history.Records.Insert(0, entry);

        if (history.Records.Count > _maxEntries)
        {
            history.Records.RemoveRange(_maxEntries, history.Records.Count - _maxEntries);
        }

        var bytes = JsonSerializer.SerializeToUtf8Bytes(history, SerializerOptions);
        _cache.Set(GetKey(memberId), bytes, new DistributedCacheEntryOptions
        {
            SlidingExpiration = _window
        });
    }

    private CommandHistory? GetHistory(Guid memberId)
    {
        var bytes = _cache.Get(GetKey(memberId));
        if (bytes is null || bytes.Length == 0)
        {
            return null;
        }

        return JsonSerializer.Deserialize<CommandHistory>(bytes, SerializerOptions);
    }

    private static CommandRecord SerializePayload(Guid commandId, object? payload)
    {
        if (payload is null)
        {
            return new CommandRecord(commandId, null, null);
        }

        var type = payload.GetType();
        return new CommandRecord(
            commandId,
            type.AssemblyQualifiedName,
            JsonSerializer.Serialize(payload, type, SerializerOptions));
    }

    private static object? DeserializePayload(CommandRecord record)
    {
        if (record.PayloadJson is null)
        {
            return null;
        }

        if (record.PayloadType is null)
        {
            return JsonSerializer.Deserialize<object>(record.PayloadJson, SerializerOptions);
        }

        var payloadType = Type.GetType(record.PayloadType, throwOnError: false);
        if (payloadType is null)
        {
            return JsonSerializer.Deserialize<object>(record.PayloadJson, SerializerOptions);
        }

        return JsonSerializer.Deserialize(record.PayloadJson, payloadType, SerializerOptions);
    }

    private static string GetKey(Guid memberId) => $"command-history:{memberId}";

    private sealed class CommandHistory
    {
        public List<CommandRecord> Records { get; set; } = [];
    }

    private sealed record CommandRecord(Guid CommandId, string? PayloadType, string? PayloadJson);
}
