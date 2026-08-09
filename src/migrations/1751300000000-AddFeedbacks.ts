import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeedbacks1751300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feedbacks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "member_id" uuid,
        "body" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedbacks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedbacks_member_id"
          FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // 어드민에서 최신순으로 훑는 경로
    await queryRunner.query(`
      CREATE INDEX "IDX_feedbacks_created_at" ON "feedbacks" ("created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedbacks_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feedbacks"`);
  }
}
