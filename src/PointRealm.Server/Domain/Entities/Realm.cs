using PointRealm.Server.Common;
using PointRealm.Server.Domain.Primitives;
using PointRealm.Server.Domain.ValueObjects;

namespace PointRealm.Server.Domain.Entities;

public sealed class Realm : Entity
{
    private readonly List<Quest> _quests = new();
    private readonly List<Encounter> _encounters = new();
    private readonly List<PartyMember> _members = new();

    public string? Name { get; private set; }
    public string Code { get; private set; }
    public string Theme { get; private set; }
    public RealmSettings Settings { get; private set; }
    public int Version { get; private set; }
    public int QuestLogVersion { get; private set; }
    public Guid? CurrentQuestId { get; private set; }
    public Guid? CurrentEncounterId { get; private set; }
    public string? CreatedByUserId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public IReadOnlyCollection<Quest> Quests => _quests.AsReadOnly();
    public IReadOnlyCollection<Encounter> Encounters => _encounters.AsReadOnly();
    public IReadOnlyCollection<PartyMember> Members => _members.AsReadOnly();

    private Realm(string code, string? name, string theme, RealmSettings settings, string? createdByUserId) : base(Guid.NewGuid())
    {
        Code = code;
        Name = name;
        Theme = theme;
        Settings = settings;
        CreatedByUserId = createdByUserId;
        CreatedAt = DateTime.UtcNow;
    }

    private Realm() { }

    public static Result<Realm> Create(string code, string? name, string theme, RealmSettings settings, string? createdByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Result.Failure<Realm>(new Error("Realm.EmptyCode", "Realm code cannot be empty."));
        }

        return new Realm(code, name, theme, settings, createdByUserId);
    }

    public void UpdateSettings(RealmSettings newSettings)
    {
        Settings = newSettings;
    }

    public void AddMember(PartyMember member)
    {
        if (_members.Any(m => m.Id == member.Id))
        {
            return;
        }
        
        _members.Add(member);
    }

    public Result<Guid> AddQuest(string title, string description, string? externalId = null, string? externalUrl = null)
    {
        var quest = new Quest(Id, title, description, _quests.Count + 1, externalId, externalUrl);
        _quests.Add(quest);
        QuestLogVersion++;
        
        if (CurrentQuestId is null)
        {
            CurrentQuestId = quest.Id;
            quest.Activate();
        }

        return quest.Id;
    }

    public Result StartEncounter(Guid questId)
    {
        var quest = _quests.FirstOrDefault(q => q.Id == questId);
        if (quest is null)
        {
            return Result.Failure(new Error("Realm.QuestNotFound", "The specified quest was not found in this realm."));
        }

        var encounter = new Encounter(questId);
        _encounters.Add(encounter);
        CurrentEncounterId = encounter.Id;
        CurrentQuestId = questId;
        quest.Activate();

        return Result.Success();
    }

    public Result SetActiveQuest(Guid questId)
    {
        var quest = _quests.FirstOrDefault(q => q.Id == questId);
        if (quest is null)
        {
            return Result.Failure(new Error("Realm.QuestNotFound", "The specified quest was not found in this realm."));
        }

        CurrentQuestId = quest.Id;
        if (quest.Status != QuestStatus.Completed)
        {
            quest.Activate();
        }

        QuestLogVersion++;
        return Result.Success();
    }

    public Result UpdateQuest(Guid questId, string title, string description, string? externalId = null, string? externalUrl = null)
    {
        var quest = _quests.FirstOrDefault(q => q.Id == questId);
        if (quest is null)
        {
            return Result.Failure(new Error("Realm.QuestNotFound", "The specified quest was not found in this realm."));
        }

        quest.UpdateDetails(title, description);
        quest.SetExternalFields(externalId, externalUrl);
        QuestLogVersion++;
        
        return Result.Success();
    }

    public Result DeleteQuest(Guid questId)
    {
        var quest = _quests.FirstOrDefault(q => q.Id == questId);
        if (quest is null)
        {
            return Result.Failure(new Error("Realm.QuestNotFound", "The specified quest was not found in this realm."));
        }

        _quests.Remove(quest);
        QuestLogVersion++;
        
        if (CurrentQuestId == questId)
        {
            CurrentQuestId = null;
        }

        return Result.Success();
    }

    public Result ReorderQuests(List<Guid> newOrder)
    {
        if (newOrder.Count != _quests.Count || newOrder.Distinct().Count() != _quests.Count || !newOrder.All(id => _quests.Any(q => q.Id == id)))
        {
             return Result.Failure(new Error("Realm.InvalidQuestOrder", "The provided quest order is invalid."));
        }

        for (int i = 0; i < newOrder.Count; i++)
        {
            var quest = _quests.First(q => q.Id == newOrder[i]);
            quest.SetOrder(i + 1);
        }

        QuestLogVersion++;
        return Result.Success();
    }
}
