using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PointRealm.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRealmName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Realms",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Realms",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "Quests",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalUrl",
                table: "Quests",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Outcome",
                table: "Encounters",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quests_RealmId_ExternalId",
                table: "Quests",
                columns: new[] { "RealmId", "ExternalId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Quests_RealmId_ExternalId",
                table: "Quests");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Realms");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Realms");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "Quests");

            migrationBuilder.DropColumn(
                name: "ExternalUrl",
                table: "Quests");

            migrationBuilder.DropColumn(
                name: "Outcome",
                table: "Encounters");
        }
    }
}
