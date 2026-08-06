import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContentActiveMediaId1751000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // contents: 눌린 상태 아이콘 미디어 FK 추가 (기존 media_id는 기본 상태 아이콘)
    await queryRunner.query(`
      ALTER TABLE "contents"
        ADD COLUMN IF NOT EXISTS "active_media_id" uuid NULL,
        ADD CONSTRAINT "FK_contents_active_media_id"
          FOREIGN KEY ("active_media_id") REFERENCES "media"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contents"
        DROP CONSTRAINT IF EXISTS "FK_contents_active_media_id",
        DROP COLUMN IF EXISTS "active_media_id"
    `);
  }
}
