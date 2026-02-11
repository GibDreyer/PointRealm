using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using PointRealm.Server.Api.Services;
using Xunit;

namespace PointRealm.Tests.Api;

public class CommandDeduplicatorTests
{
    [Fact]
    public void InMemoryDeduplicator_ShouldSuppressDuplicateCommands_AndEnforceCapacity()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var deduplicator = new InMemoryCommandDeduplicator(cache, maxEntries: 2, window: TimeSpan.FromMinutes(2));
        var memberId = Guid.NewGuid();
        var commandA = Guid.NewGuid();
        var commandB = Guid.NewGuid();
        var commandC = Guid.NewGuid();

        deduplicator.StoreResult(memberId, commandA, "first");
        deduplicator.StoreResult(memberId, commandB, "second");
        deduplicator.StoreResult(memberId, commandC, "third");

        deduplicator.TryGetResult(memberId, commandA, out _).Should().BeFalse();

        deduplicator.TryGetResult(memberId, commandB, out var payloadB).Should().BeTrue();
        payloadB.Should().Be("second");

        deduplicator.TryGetResult(memberId, commandC, out var payloadC).Should().BeTrue();
        payloadC.Should().Be("third");
    }

    [Fact]
    public void DistributedDeduplicator_ShouldShareResultsAcrossInstances()
    {
        var clock = new TestClock(DateTimeOffset.UtcNow);
        var cache = new FakeDistributedCache(clock);
        var instanceA = new DistributedCommandDeduplicator(cache, maxEntries: 50, window: TimeSpan.FromSeconds(30));
        var instanceB = new DistributedCommandDeduplicator(cache, maxEntries: 50, window: TimeSpan.FromSeconds(30));

        var memberId = Guid.NewGuid();
        var commandId = Guid.NewGuid();

        instanceA.StoreResult(memberId, commandId, "cached-value");

        instanceB.TryGetResult(memberId, commandId, out var payload).Should().BeTrue();
        payload.Should().Be("cached-value");
    }

    [Fact]
    public void DistributedDeduplicator_ShouldExpireEntries_ButRefreshSlidingWindowOnAccess()
    {
        var clock = new TestClock(DateTimeOffset.UtcNow);
        var cache = new FakeDistributedCache(clock);
        var deduplicator = new DistributedCommandDeduplicator(cache, maxEntries: 50, window: TimeSpan.FromSeconds(30));

        var memberId = Guid.NewGuid();
        var commandId = Guid.NewGuid();

        deduplicator.StoreResult(memberId, commandId, "cached");

        clock.Advance(TimeSpan.FromSeconds(20));
        deduplicator.TryGetResult(memberId, commandId, out _).Should().BeTrue();

        clock.Advance(TimeSpan.FromSeconds(20));
        deduplicator.TryGetResult(memberId, commandId, out _).Should().BeTrue();

        clock.Advance(TimeSpan.FromSeconds(31));
        deduplicator.TryGetResult(memberId, commandId, out _).Should().BeFalse();
    }

    private sealed class TestClock(DateTimeOffset start)
    {
        public DateTimeOffset UtcNow { get; private set; } = start;

        public void Advance(TimeSpan delta) => UtcNow = UtcNow.Add(delta);
    }

    private sealed class FakeDistributedCache(TestClock clock) : IDistributedCache
    {
        private readonly Dictionary<string, CacheEntry> _entries = new();

        public byte[]? Get(string key)
        {
            if (!TryGetLiveEntry(key, out var entry))
            {
                return null;
            }

            Touch(entry);
            return entry.Value;
        }

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default)
            => Task.FromResult(Get(key));

        public void Refresh(string key)
        {
            if (TryGetLiveEntry(key, out var entry))
            {
                Touch(entry);
            }
        }

        public Task RefreshAsync(string key, CancellationToken token = default)
        {
            Refresh(key);
            return Task.CompletedTask;
        }

        public void Remove(string key) => _entries.Remove(key);

        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            Remove(key);
            return Task.CompletedTask;
        }

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
        {
            var expiresAt = ResolveExpiration(clock.UtcNow, options);
            _entries[key] = new CacheEntry(value, options.SlidingExpiration, expiresAt);
        }

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
        {
            Set(key, value, options);
            return Task.CompletedTask;
        }

        private bool TryGetLiveEntry(string key, out CacheEntry entry)
        {
            if (_entries.TryGetValue(key, out var found))
            {
                if (found.ExpiresAtUtc <= clock.UtcNow)
                {
                    _entries.Remove(key);
                }
                else
                {
                    entry = found;
                    return true;
                }
            }

            entry = null!;
            return false;
        }

        private static DateTimeOffset ResolveExpiration(DateTimeOffset now, DistributedCacheEntryOptions options)
        {
            if (options.AbsoluteExpirationRelativeToNow.HasValue)
            {
                return now.Add(options.AbsoluteExpirationRelativeToNow.Value);
            }

            if (options.AbsoluteExpiration.HasValue)
            {
                return options.AbsoluteExpiration.Value;
            }

            if (options.SlidingExpiration.HasValue)
            {
                return now.Add(options.SlidingExpiration.Value);
            }

            return DateTimeOffset.MaxValue;
        }

        private void Touch(CacheEntry entry)
        {
            if (entry.SlidingExpiration.HasValue)
            {
                entry.ExpiresAtUtc = clock.UtcNow.Add(entry.SlidingExpiration.Value);
            }
        }

        private sealed class CacheEntry(byte[] value, TimeSpan? slidingExpiration, DateTimeOffset expiresAtUtc)
        {
            public byte[] Value { get; } = value;
            public TimeSpan? SlidingExpiration { get; } = slidingExpiration;
            public DateTimeOffset ExpiresAtUtc { get; set; } = expiresAtUtc;
        }
    }
}
