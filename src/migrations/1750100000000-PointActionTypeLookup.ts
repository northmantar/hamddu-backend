import { MigrationInterface, QueryRunner } from "typeorm";

export class PointActionTypeLookup1750100000000 implements MigrationInterface {
  name = "PointActionTypeLookup1750100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "point_action_types" (
        "code" varchar(50) NOT NULL,
        "label_ko" varchar(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_point_action_types" PRIMARY KEY ("code")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "point_action_types" ("code", "label_ko", "is_active") VALUES
        ('WATCH', '시청', true),
        ('CHALLENGE', '챌린지', true),
        ('COMMENT', '댓글', true)
    `);

    await queryRunner.query(`
      ALTER TABLE "point_earning_policies"
        ALTER COLUMN "action_type" TYPE varchar(50) USING "action_type"::text
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "point_action_type_enum"`);

    await queryRunner.query(`
      ALTER TABLE "point_earning_policies"
        ADD CONSTRAINT "FK_point_earning_policies_action_type"
        FOREIGN KEY ("action_type")
        REFERENCES "point_action_types"("code")
        ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "point_earning_policies"
        DROP CONSTRAINT IF EXISTS "FK_point_earning_policies_action_type"
    `);

    await queryRunner.query(`
      CREATE TYPE "point_action_type_enum" AS ENUM ('WATCH', 'CHALLENGE', 'COMMENT')
    `);

    await queryRunner.query(`
      ALTER TABLE "point_earning_policies"
        ALTER COLUMN "action_type" TYPE "point_action_type_enum" USING "action_type"::"point_action_type_enum"
    `);

    await queryRunner.query(`DROP TABLE "point_action_types"`);
  }
}
