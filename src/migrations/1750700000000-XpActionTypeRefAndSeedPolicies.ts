import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * XP 보상 데이터주도 전환.
 * - xp_action_types 에 ref_type/ref_action 추가 (point 와 동일 구조, reward_action_enum 재사용)
 * - 기존 임시 시드(SIGNUP/DAILY_LOGIN) → 실제 계측 이벤트 카탈로그로 교체
 * - xp_earning_policies 에 기존 하드코딩 XP_AMOUNT_MAP 금액을 시드 → 전환 시 XP 지급이 끊기지 않도록 보존
 *   (기존 XpProcessor 동작 = 이벤트마다 지급이므로 isOneTime=false)
 * (ref/reward-policy-v2.md §11)
 */
export class XpActionTypeRefAndSeedPolicies1750700000000 implements MigrationInterface {
  name = "XpActionTypeRefAndSeedPolicies1750700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "xp_action_types"
        ADD COLUMN "ref_type" varchar(50),
        ADD COLUMN "ref_action" "reward_action_enum"
    `);

    // 임시 시드 제거 (참조 정책 없음)
    await queryRunner.query(`DELETE FROM "xp_action_types" WHERE "code" IN ('SIGNUP', 'DAILY_LOGIN')`);

    // 실제 계측 이벤트로 카탈로그 시드
    await queryRunner.query(`
      INSERT INTO "xp_action_types" ("code", "label_ko", "is_active", "ref_type", "ref_action") VALUES
        ('USER_SIGNUP',  '회원가입',        true, 'users',          'CREATE'),
        ('WATCH',        '튜토리얼 시청 완료', true, 'tutorial_watch', 'CREATE'),
        ('CHALLENGE',    '챌린지 작성',      true, 'challenge',      'CREATE'),
        ('COMMENT',      '댓글 작성',        true, 'board_comment',  'CREATE'),
        ('BOARD_CREATE', '게시글 작성',      true, 'board',          'CREATE')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "xp_action_types"
        ALTER COLUMN "ref_type" SET NOT NULL,
        ALTER COLUMN "ref_action" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "xp_action_types"
        ADD CONSTRAINT "UQ_xp_action_types_ref" UNIQUE ("ref_type", "ref_action")
    `);

    // 기존 XP_AMOUNT_MAP 금액을 정책으로 시드 (전환 후에도 동일 지급)
    await queryRunner.query(`
      INSERT INTO "xp_earning_policies" ("action_type", "xp_amount", "is_one_time", "is_active") VALUES
        ('USER_SIGNUP',  100, false, true),
        ('WATCH',        30,  false, true),
        ('CHALLENGE',    50,  false, true),
        ('COMMENT',      10,  false, true),
        ('BOARD_CREATE', 20,  false, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "xp_earning_policies"
      WHERE "action_type" IN ('USER_SIGNUP', 'WATCH', 'CHALLENGE', 'COMMENT', 'BOARD_CREATE')
    `);
    await queryRunner.query(`ALTER TABLE "xp_action_types" DROP CONSTRAINT IF EXISTS "UQ_xp_action_types_ref"`);
    await queryRunner.query(`
      DELETE FROM "xp_action_types"
      WHERE "code" IN ('USER_SIGNUP', 'WATCH', 'CHALLENGE', 'COMMENT', 'BOARD_CREATE')
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_action_types" DROP COLUMN IF EXISTS "ref_action", DROP COLUMN IF EXISTS "ref_type"
    `);
    await queryRunner.query(`
      INSERT INTO "xp_action_types" ("code", "label_ko", "is_active") VALUES
        ('SIGNUP', '회원가입', true),
        ('DAILY_LOGIN', '일일 로그인', true)
      ON CONFLICT ("code") DO NOTHING
    `);
  }
}
