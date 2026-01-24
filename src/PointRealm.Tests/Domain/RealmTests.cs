using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using Xunit;

namespace PointRealm.Tests.Domain;

public class RealmTests
{
    [Fact]
    public void Create_Realm_WithEmptyCode_ShouldFail()
    {
        // Arrange
        var settings = RealmSettings.Default();
        
        // Act
        var result = Realm.Create("", "Dark", settings);
        
        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Realm.EmptyCode", result.Error.Code);
    }

    [Fact]
    public void Create_Realm_WithValidCode_ShouldSucceed()
    {
        // Arrange
        var settings = RealmSettings.Default();
        
        // Act
        var result = Realm.Create("test-realm", "Dark", settings);
        
        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("test-realm", result.Value.Code);
    }

    [Fact]
    public void AddQuest_Should_SetCurrentQuest_When_FirstQuestAdded()
    {
        // Arrange
        var realm = Realm.Create("test", "theme", RealmSettings.Default()).Value;
        
        // Act
        realm.AddQuest("Test Quest", "Description");
        
        // Assert
        Assert.Single(realm.Quests);
        Assert.NotNull(realm.CurrentQuestId);
        Assert.Equal(realm.Quests.First().Id, realm.CurrentQuestId);
    }

    [Fact]
    public void StartEncounter_Should_Fail_When_QuestNotFound()
    {
        // Arrange
        var realm = Realm.Create("test", "theme", RealmSettings.Default()).Value;
        
        // Act
        var result = realm.StartEncounter(Guid.NewGuid());
        
        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Realm.QuestNotFound", result.Error.Code);
    }

    [Fact]
    public void StartEncounter_Should_Succeed_When_QuestExists()
    {
        // Arrange
        var realm = Realm.Create("test", "theme", RealmSettings.Default()).Value;
        realm.AddQuest("Test Quest", "Description");
        var questId = realm.CurrentQuestId!.Value;
        
        // Act
        var result = realm.StartEncounter(questId);
        
        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(realm.CurrentEncounterId);
        Assert.Single(realm.Encounters);
    }

    [Fact]
    public void Encounter_Reveal_Should_Fail_IfAlreadyRevealed()
    {
        // Arrange
        var realm = Realm.Create("test", "theme", RealmSettings.Default()).Value;
        realm.AddQuest("Test Quest", "Description");
        realm.StartEncounter(realm.CurrentQuestId!.Value);
        var encounter = realm.Encounters.First();
        
        // Act
        encounter.Reveal();
        var result = encounter.Reveal();
        
        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Encounter.AlreadyRevealed", result.Error.Code);
    }

    [Fact]
    public void Encounter_CastVote_Should_Fail_IfRevealed()
    {
        // Arrange
        var realm = Realm.Create("test", "theme", RealmSettings.Default()).Value;
        realm.AddQuest("Test Quest", "Description");
        realm.StartEncounter(realm.CurrentQuestId!.Value);
        var encounter = realm.Encounters.First();
        encounter.Reveal();
        
        var memberId = Guid.NewGuid();
        var card = new RuneCardValue("1", 1);

        // Act
        var result = encounter.CastVote(memberId, card);
        
        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Encounter.AlreadyRevealed", result.Error.Code);
    }
}
