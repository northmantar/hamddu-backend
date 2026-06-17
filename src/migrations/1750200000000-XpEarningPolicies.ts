import { MigrationInterface, QueryRunner } from "typeorm";

export class XpEarningPolicies1750200000000 implements MigrationInterface {
  name = "XpEarningPolicies1750200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "xp_action_types" (
        "code" varchar(50) NOT NULL,
        "label_ko" varchar(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_xp_action_types" PRIMARY KEY ("code")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "xp_action_types" ("code", "label_ko", "is_active") VALUES
        ('SIGNUP', '회원가입', true),
        ('DAILY_LOGIN', '일일 로그인', true)
    `);

    await queryRunner.query(`
      CREATE TABLE "xp_earning_policies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action_type" varchar(50) NOT NULL,
        "xp_amount" integer NOT NULL,
        "is_one_time" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_xp_earning_policies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_xp_earning_policies_action_type"
          FOREIGN KEY ("action_type")
          REFERENCES "xp_action_types"("code")
          ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "xp_earning_policies"`);
    await queryRunner.query(`DROP TABLE "xp_action_types"`);
  }
}
