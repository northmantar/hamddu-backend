import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 회원가입 보상 카탈로그 시드. (users, CREATE) 이벤트가 계측되므로(users.service.findOrCreate emit),
 * 어드민에서 바로 포인트 지급 정책을 붙일 수 있도록 카탈로그 행을 넣는다.
 * (ref/reward-policy-v2.md)
 */
export class SeedUserSignupActionType1750500000000 implements MigrationInterface {
  name = "SeedUserSignupActionType1750500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "point_action_types" ("code", "label_ko", "is_active", "ref_type", "ref_action")
      VALUES ('USER_SIGNUP', '회원가입', true, 'users', 'CREATE')
      ON CONFLICT ("code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "point_action_types" WHERE "code" = 'USER_SIGNUP'`);
  }
}
