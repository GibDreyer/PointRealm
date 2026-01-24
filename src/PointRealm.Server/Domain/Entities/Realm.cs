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

    private Realm() { } // EF Core

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

    public Result AddQuest(string title, string description)
    {
        var quest = new Quest(Id, title, description, _quests.Count + 1);
        _quests.Add(quest);
        
        if (CurrentQuestId is null)
        {
            CurrentQuestId = quest.Id;
            quest.Activate();
        }

        return Result.Success();
    }

    public Result StartEncounter(Guid questId)
    {
        var quest = _quests.FirstOrDefault(q => q.Id == questId);
        if (quest is null)
        {
            return Result.Failure(new Error("Realm.QuestNotFound", "The specified quest was not found in this realm."));
        }

        // If there is an active encounter, maybe we should error or finish it?
        // For now, let's just start a new one and update the reference.
        var encounter = new Encounter(questId);
        _encounters.Add(encounter);
        CurrentEncounterId = encounter.Id;

        return Result.Success();
    }

    public Result UpdateQuest(Guid questId, string title, string description)
    {
        var quest = _quests.FirstOrDefault(q => q.Id == questId);
        if (quest is null)
        {
            return Result.Failure(new Error("Realm.QuestNotFound", "The specified quest was not found in this realm."));
        }

        // We need to expose a method on Quest to update it, but for now assuming we can't directly set private setters.
        // Let's modify Quest to allow updates or use reflection/internal if strictly needed, 
        // but adding a method to Quest is cleaner. 
        // Since I can't edit Quest in this same tool call, I will add the method to Realm and then go update Quest.
        // Wait, I can only rely on what's available. 
        // I will assume I will add `UpdateDetails` to Quest.
        quest.UpdateDetails(title, description);
        
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
        
        // If the deleted quest was determining the current quest, we might need to handle that.
        if (CurrentQuestId == questId)
        {
            CurrentQuestId = null;
        }

        return Result.Success();
    }

    public Result ReorderQuests(List<Guid> newOrder)
    {
        // Simple reordering logic
        // Verify all IDs exist
        if (newOrder.Count != _quests.Count || !newOrder.All(id => _quests.Any(q => q.Id == id)))
        {
             return Result.Failure(new Error("Realm.InvalidQuestOrder", "The provided quest order is invalid."));
        }

        // We need a way to set Order on Quest. assuming `SetOrder` method.
        for (int i = 0; i < newOrder.Count; i++)
        {
            var quest = _quests.First(q => q.Id == newOrder[i]);
            quest.SetOrder(i + 1);
        }

        return Result.Success();
    }
}
