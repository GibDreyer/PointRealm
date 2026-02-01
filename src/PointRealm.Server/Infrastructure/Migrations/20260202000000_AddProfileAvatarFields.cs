using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PointRealm.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileAvatarFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfileEmoji",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfileEmoji",
                table: "PartyMembers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfileImageUrl",
                table: "PartyMembers",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfileEmoji",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ProfileEmoji",
                table: "PartyMembers");

            migrationBuilder.DropColumn(
                name: "ProfileImageUrl",
                table: "PartyMembers");
        }
    }
}
