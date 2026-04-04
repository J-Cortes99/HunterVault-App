using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HunterVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTrophyPercentage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TrophyPercentage",
                table: "Games",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TrophyPercentage",
                table: "Games");
        }
    }
}
