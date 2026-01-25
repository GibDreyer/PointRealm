using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PointRealm.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ServerTruthPipeline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "QuestLogVersion",
                table: "Realms",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "Realms",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SealedOutcome",
                table: "Quests",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "Quests",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsBanned",
                table: "PartyMembers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsObserver",
                table: "PartyMembers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsOnline",
                table: "PartyMembers",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "Encounters",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QuestLogVersion",
                table: "Realms");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Realms");

            migrationBuilder.DropColumn(
                name: "SealedOutcome",
                table: "Quests");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Quests");

            migrationBuilder.DropColumn(
                name: "IsBanned",
                table: "PartyMembers");

            migrationBuilder.DropColumn(
                name: "IsObserver",
                table: "PartyMembers");

            migrationBuilder.DropColumn(
                name: "IsOnline",
                table: "PartyMembers");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Encounters");
        }
    }
}
