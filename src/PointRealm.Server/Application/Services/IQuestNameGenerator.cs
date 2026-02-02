namespace PointRealm.Server.Application.Services;

public interface IQuestNameGenerator
{
    (string Title, string Description) GenerateRandomQuest();
}
