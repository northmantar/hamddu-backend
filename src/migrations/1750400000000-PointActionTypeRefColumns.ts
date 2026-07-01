import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 보상 정책 v2 (포인트 단계): point_action_types 를 (ref_type, ref_action) 기반 카탈로그로 확장.
 * - reward_action_enum (CRUD) 신설
 * - point_action_types 에 ref_type / ref_action 추가 + 기존 코드 backfill + UNIQUE
 * - BOARD_CREATE 카탈로그 시드 (정책은 어드민에서 추가 — 배관만)
 * (ref/reward-policy-v2.md §3, §9)
 */
export class PointActionTypeRefColumns1750400000000 implements MigrationInterface {
  name = "PointActionTypeRefColumns1750400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "reward_action_enum" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE')
    `);

    await queryRunner.query(`
      ALTER TABLE "point_action_types"
        ADD COLUMN "ref_type" varchar(50),
        ADD COLUMN "ref_action" "reward_action_enum"
    `);

    // 기존 시드 코드 backfill
    await queryRunner.query(`
      UPDATE "point_action_types" SET "ref_type" = 'watch_history', "ref_action" = 'CREATE' WHERE "code" = 'WATCH'
    `);
    await queryRunner.query(`
      UPDATE "point_action_types" SET "ref_type" = 'challenge', "ref_action" = 'CREATE' WHERE "code" = 'CHALLENGE'
    `);
    await queryRunner.query(`
      UPDATE "point_action_types" SET "ref_type" = 'board_comment', "ref_action" = 'CREATE' WHERE "code" = 'COMMENT'
    `);

    // 게시글 작성 카탈로그 신규 (정책 없음 → 어드민에서 추가 시 지급 시작)
    await queryRunner.query(`
      INSERT INTO "point_action_types" ("code", "label_ko", "is_active", "ref_type", "ref_action")
      VALUES ('BOARD_CREATE', '게시글 작성', true, 'board', 'CREATE')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "point_action_types"
        ALTER COLUMN "ref_type" SET NOT NULL,
        ALTER COLUMN "ref_action" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "point_action_types"
        ADD CONSTRAINT "UQ_point_action_types_ref" UNIQUE ("ref_type", "ref_action")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "point_action_types" DROP CONSTRAINT IF EXISTS "UQ_point_action_types_ref"
    `);
    await queryRunner.query(`DELETE FROM "point_action_types" WHERE "code" = 'BOARD_CREATE'`);
    await queryRunner.query(`
      ALTER TABLE "point_action_types" DROP COLUMN IF EXISTS "ref_action", DROP COLUMN IF EXISTS "ref_type"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "reward_action_enum"`);
  }
}
