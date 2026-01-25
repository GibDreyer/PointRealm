using Microsoft.Extensions.Caching.Memory;

namespace PointRealm.Server.Api.Services;

public sealed class InMemoryCommandDeduplicator : ICommandDeduplicator
{
    private readonly IMemoryCache _cache;
    private readonly int _maxEntries;
    private readonly TimeSpan _window;

    public InMemoryCommandDeduplicator(IMemoryCache cache, int maxEntries = 50, TimeSpan? window = null)
    {
        _cache = cache;
        _maxEntries = maxEntries;
        _window = window ?? TimeSpan.FromMinutes(2);
    }

    public bool TryGetResult(Guid memberId, Guid commandId, out object? payload)
    {
        payload = null;
        if (!_cache.TryGetValue(GetKey(memberId), out CommandHistory? history) || history is null)
        {
            return false;
        }

        return history.TryGet(commandId, out payload);
    }

    public void StoreResult(Guid memberId, Guid commandId, object? payload)
    {
        var history = _cache.GetOrCreate(GetKey(memberId), entry =>
        {
            entry.SlidingExpiration = _window;
            return new CommandHistory(_maxEntries);
        });

        history?.Add(commandId, payload);
    }

    private static string GetKey(Guid memberId) => $"command-history:{memberId}";

    private sealed class CommandHistory
    {
        private readonly int _capacity;
        private readonly Dictionary<Guid, LinkedListNode<CommandRecord>> _index = new();
        private readonly LinkedList<CommandRecord> _order = new();
        private readonly object _lock = new();

        public CommandHistory(int capacity)
        {
            _capacity = capacity;
        }

        public bool TryGet(Guid commandId, out object? payload)
        {
            lock (_lock)
            {
                if (_index.TryGetValue(commandId, out var node))
                {
                    payload = node.Value.Payload;
                    return true;
                }
            }

            payload = null;
            return false;
        }

        public void Add(Guid commandId, object? payload)
        {
            lock (_lock)
            {
                if (_index.ContainsKey(commandId))
                {
                    return;
                }

                var record = new CommandRecord(commandId, payload);
                var node = _order.AddFirst(record);
                _index[commandId] = node;

                if (_order.Count > _capacity)
                {
                    var last = _order.Last;
                    if (last is null) return;
                    _order.RemoveLast();
                    _index.Remove(last.Value.CommandId);
                }
            }
        }
    }

    private sealed record CommandRecord(Guid CommandId, object? Payload);
}
