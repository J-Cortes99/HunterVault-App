using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HunterVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameGameFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReleaseDate",
                table: "Games",
                newName: "CompletionDate");

            migrationBuilder.RenameColumn(
                name: "EnjoymentRating",
                table: "Games",
                newName: "DifficultyRating");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DifficultyRating",
                table: "Games",
                newName: "EnjoymentRating");

            migrationBuilder.RenameColumn(
                name: "CompletionDate",
                table: "Games",
                newName: "ReleaseDate");
        }
    }
}
