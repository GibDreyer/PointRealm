using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.Entities;

public enum QuestStatus
{
    Pending = 1,
    Active = 2,
    Completed = 3
}

public sealed class Quest : Entity
{
    public string Title { get; private set; }
    public string Description { get; private set; }
    public int Order { get; private set; }
    public QuestStatus Status { get; private set; }
    public Guid RealmId { get; private set; }
    public string? ExternalId { get; private set; }
    public string? ExternalUrl { get; private set; }

    internal Quest(Guid realmId, string title, string description, int order, string? externalId = null, string? externalUrl = null) : base(Guid.NewGuid())
    {
        RealmId = realmId;
        Title = title;
        Description = description;
        Order = order;
        Status = QuestStatus.Pending;
        ExternalId = externalId;
        ExternalUrl = externalUrl;
    }

    private Quest() { } // EF Core

    public void Activate()
    {
        Status = QuestStatus.Active;
    }

    public void Complete()
    {
        Status = QuestStatus.Completed;
    }

    internal void UpdateDetails(string title, string description)
    {
        Title = title;
        Description = description;
    }

    public void SetOrder(int order)
    {
        Order = order;
    }

    public void SetExternalFields(string? externalId, string? externalUrl)
    {
        ExternalId = externalId;
        ExternalUrl = externalUrl;
    }
}
