using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PointRealm.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPartyMemberAvatarEmoji : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarEmoji",
                table: "PartyMembers",
                type: "TEXT",
                maxLength: 16,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarEmoji",
                table: "PartyMembers");
        }
    }
}
