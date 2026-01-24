using PointRealm.Server.Common;
using PointRealm.Server.Domain.Primitives;
using PointRealm.Server.Domain.ValueObjects;

namespace PointRealm.Server.Domain.Entities;

public sealed class Realm : Entity
{
    private readonly List<Quest> _quests = new();
    private readonly List<Encounter> _encounters = new();
    private readonly List<PartyMember> _members = new();

    public string Code { get; private set; }
    public string Theme { get; private set; }
    public RealmSettings Settings { get; private set; }
    public Guid? CurrentQuestId { get; private set; }
    public Guid? CurrentEncounterId { get; private set; }

    public IReadOnlyCollection<Quest> Quests => _quests.AsReadOnly();
    public IReadOnlyCollection<Encounter> Encounters => _encounters.AsReadOnly();
    public IReadOnlyCollection<PartyMember> Members => _members.AsReadOnly();

    private Realm(string code, string theme, RealmSettings settings) : base(Guid.NewGuid())
    {
        Code = code;
        Theme = theme;
        Settings = settings;
    }

    private Realm() { } // EF Core

    public static Result<Realm> Create(string code, string theme, RealmSettings settings)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Result.Failure<Realm>(new Error("Realm.EmptyCode", "Realm code cannot be empty."));
        }

        return new Realm(code, theme, settings);
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
        var quest = new Quest(Id, title, description);
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
}
