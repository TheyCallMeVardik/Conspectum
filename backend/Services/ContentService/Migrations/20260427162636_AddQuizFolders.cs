using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ContentService.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizFolders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FolderId",
                table: "Quizzes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "QuizFolders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizFolders", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_FolderId",
                table: "Quizzes",
                column: "FolderId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizFolders_UserId",
                table: "QuizFolders",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_QuizFolders_FolderId",
                table: "Quizzes",
                column: "FolderId",
                principalTable: "QuizFolders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_QuizFolders_FolderId",
                table: "Quizzes");

            migrationBuilder.DropTable(
                name: "QuizFolders");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_FolderId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "FolderId",
                table: "Quizzes");
        }
    }
}
