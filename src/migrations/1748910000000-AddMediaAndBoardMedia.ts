import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMediaAndBoardMedia1748910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "media" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "uploader_id" uuid,
        "url" text NOT NULL,
        "mime_type" varchar(100),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_media" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "media"
      ADD CONSTRAINT "FK_media_uploader_id"
      FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "board_media" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "board_id" uuid NOT NULL,
        "media_id" uuid NOT NULL,
        "sort_order" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_media" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "board_media"
      ADD CONSTRAINT "FK_board_media_board_id"
      FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "board_media"
      ADD CONSTRAINT "FK_board_media_media_id"
      FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "boards"
      ADD COLUMN IF NOT EXISTS "thumbnail_media_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "boards"
      ADD CONSTRAINT "FK_boards_thumbnail_media_id"
      FOREIGN KEY ("thumbnail_media_id") REFERENCES "media"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`CREATE INDEX "IDX_board_media_board_id" ON "board_media" ("board_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_media_sort_order" ON "board_media" ("board_id", "sort_order")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_media_sort_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_media_board_id"`);

    await queryRunner.query(`ALTER TABLE "boards" DROP CONSTRAINT IF EXISTS "FK_boards_thumbnail_media_id"`);
    await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN IF EXISTS "thumbnail_media_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "board_media"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "media"`);
  }
}
