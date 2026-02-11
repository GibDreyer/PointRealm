namespace PointRealm.Server.Api.Options;

public sealed class CommandDeduplicationOptions
{
    public const string SectionName = "CommandDeduplication";

    public string Provider { get; set; } = Providers.InMemory;

    public int MaxEntriesPerMember { get; set; } = 50;

    public int WindowSeconds { get; set; } = 120;

    public RedisOptions Redis { get; set; } = new();

    public TimeSpan Window => TimeSpan.FromSeconds(Math.Max(1, WindowSeconds));

    public static class Providers
    {
        public const string InMemory = "InMemory";
        public const string Redis = "Redis";
    }

    public sealed class RedisOptions
    {
        public string? ConnectionString { get; set; }

        public string? InstanceName { get; set; }
    }
}
