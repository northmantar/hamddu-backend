import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * xp_transactions.policy_id (레벨 정책 스냅샷 — 실사용 안 됨)를
 * 지급 정책 참조(earning_policy_id → xp_earning_policies)로 전환.
 * 이로써 XP dedup 을 정책 단위로 할 수 있어 포인트와 대칭이 되고
 * "한 이벤트 N개 정책 + isOneTime" 조합이 정밀하게 동작한다.
 * (ref/reward-policy-v2.md §11)
 *
 * 기존 값은 레벨 정책 id(미사용)라 지급 정책으로 매핑 불가 → NULL 로 정리.
 */
export class XpTransactionEarningPolicyRef1750800000000 implements MigrationInterface {
  name = "XpTransactionEarningPolicyRef1750800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "xp_transactions" DROP CONSTRAINT IF EXISTS "FK_xp_transactions_policy_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions" RENAME COLUMN "policy_id" TO "earning_policy_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions" ALTER COLUMN "earning_policy_id" DROP NOT NULL
    `);
    // 기존 레벨 스냅샷 값 정리 (지급 정책 id 아님)
    await queryRunner.query(`UPDATE "xp_transactions" SET "earning_policy_id" = NULL`);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions"
        ADD CONSTRAINT "FK_xp_transactions_earning_policy_id"
        FOREIGN KEY ("earning_policy_id")
        REFERENCES "xp_earning_policies"("id")
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "xp_transactions" DROP CONSTRAINT IF EXISTS "FK_xp_transactions_earning_policy_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions" RENAME COLUMN "earning_policy_id" TO "policy_id"
    `);
    // 레벨 스냅샷 값은 복원 불가 → nullable 유지한 채 레벨 정책 FK 재부여
    await queryRunner.query(`
      ALTER TABLE "xp_transactions"
        ADD CONSTRAINT "FK_xp_transactions_policy_id"
        FOREIGN KEY ("policy_id")
        REFERENCES "xp_level_policies"("id")
        ON DELETE CASCADE
    `);
  }
}
