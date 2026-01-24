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

    internal Quest(Guid realmId, string title, string description, int order) : base(Guid.NewGuid())
    {
        RealmId = realmId;
        Title = title;
        Description = description;
        Order = order;
        Status = QuestStatus.Pending;
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
}
