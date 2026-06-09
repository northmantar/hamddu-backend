import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNicknameAndReportColumnNames1749460000000
  implements MigrationInterface
{
  name = "FixNicknameAndReportColumnNames1749460000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // nickname_adjectives: "isActive" → is_active
    await queryRunner.query(`
      ALTER TABLE "nickname_adjectives" RENAME COLUMN "isActive" TO "is_active"
    `);

    // nickname_nouns: "isActive" → is_active
    await queryRunner.query(`
      ALTER TABLE "nickname_nouns" RENAME COLUMN "isActive" TO "is_active"
    `);

    // nickname_bases: "baseNickname" → base_nickname, "nextSuffix" → next_suffix
    await queryRunner.query(`
      ALTER TABLE "nickname_bases" RENAME COLUMN "baseNickname" TO "base_nickname"
    `);
    await queryRunner.query(`
      ALTER TABLE "nickname_bases" RENAME COLUMN "nextSuffix" TO "next_suffix"
    `);

    // boards: "isHidden" → is_hidden
    await queryRunner.query(`
      ALTER TABLE "boards" RENAME COLUMN "isHidden" TO "is_hidden"
    `);

    // board_comments: "isHidden" → is_hidden
    await queryRunner.query(`
      ALTER TABLE "board_comments" RENAME COLUMN "isHidden" TO "is_hidden"
    `);

    // comment_reports: camelCase 컬럼 → snake_case
    await queryRunner.query(`
      ALTER TABLE "comment_reports" RENAME COLUMN "commentId" TO "comment_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "comment_reports" RENAME COLUMN "reporterId" TO "reporter_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "comment_reports" RENAME COLUMN "createdAt" TO "created_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "comment_reports" RENAME COLUMN "processedAt" TO "processed_at"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "comment_reports" RENAME COLUMN "processed_at" TO "processedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "comment_reports" RENAME COLUMN "created_at" TO "createdAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "comment_reports" RENAME COLUMN "reporter_id" TO "reporterId"
    `);
    await queryRunner.query(`
      ALTER TABLE "comment_reports" RENAME COLUMN "comment_id" TO "commentId"
    `);

    await queryRunner.query(`
      ALTER TABLE "board_comments" RENAME COLUMN "is_hidden" TO "isHidden"
    `);
    await queryRunner.query(`
      ALTER TABLE "boards" RENAME COLUMN "is_hidden" TO "isHidden"
    `);

    await queryRunner.query(`
      ALTER TABLE "nickname_bases" RENAME COLUMN "next_suffix" TO "nextSuffix"
    `);
    await queryRunner.query(`
      ALTER TABLE "nickname_bases" RENAME COLUMN "base_nickname" TO "baseNickname"
    `);
    await queryRunner.query(`
      ALTER TABLE "nickname_nouns" RENAME COLUMN "is_active" TO "isActive"
    `);
    await queryRunner.query(`
      ALTER TABLE "nickname_adjectives" RENAME COLUMN "is_active" TO "isActive"
    `);
  }
}
