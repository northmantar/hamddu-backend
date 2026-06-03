import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceImageUrlWithMediaId1748920000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // challenges: drop image_url, add media_id FK
    await queryRunner.query(`
      ALTER TABLE "challenges"
        DROP COLUMN IF EXISTS "image_url",
        ADD COLUMN IF NOT EXISTS "media_id" uuid NULL,
        ADD CONSTRAINT "FK_challenges_media_id"
          FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL
    `);

    // contents: drop image_url, add media_id FK
    await queryRunner.query(`
      ALTER TABLE "contents"
        DROP COLUMN IF EXISTS "image_url",
        ADD COLUMN IF NOT EXISTS "media_id" uuid NULL,
        ADD CONSTRAINT "FK_contents_media_id"
          FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contents"
        DROP CONSTRAINT IF EXISTS "FK_contents_media_id",
        DROP COLUMN IF EXISTS "media_id",
        ADD COLUMN IF NOT EXISTS "image_url" text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "challenges"
        DROP CONSTRAINT IF EXISTS "FK_challenges_media_id",
        DROP COLUMN IF EXISTS "media_id",
        ADD COLUMN IF NOT EXISTS "image_url" text NULL
    `);
  }
}
