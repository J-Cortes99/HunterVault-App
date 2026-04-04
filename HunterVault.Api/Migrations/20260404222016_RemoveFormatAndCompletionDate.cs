using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HunterVault.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveFormatAndCompletionDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletionDate",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Format",
                table: "Games");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "CompletionDate",
                table: "Games",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Format",
                table: "Games",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
