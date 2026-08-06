import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChannelHome1751100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // channels: 채널 홈 소개 영역 (설명 + 프로필/배너 이미지)
    await queryRunner.query(`
      ALTER TABLE "channels"
        ADD COLUMN IF NOT EXISTS "description" text NULL,
        ADD COLUMN IF NOT EXISTS "profile_media_id" uuid NULL,
        ADD COLUMN IF NOT EXISTS "banner_media_id" uuid NULL,
        ADD CONSTRAINT "FK_channels_profile_media_id"
          FOREIGN KEY ("profile_media_id") REFERENCES "media"("id") ON DELETE SET NULL,
        ADD CONSTRAINT "FK_channels_banner_media_id"
          FOREIGN KEY ("banner_media_id") REFERENCES "media"("id") ON DELETE SET NULL
    `);

    // channel_links: 채널 홈 외부 링크 (인스타그램/스마트스토어 등)
    await queryRunner.query(`
      CREATE TYPE "channel_links_type_enum"
        AS ENUM ('instagram', 'smartstore', 'youtube', 'website', 'etc')
    `);

    await queryRunner.query(`
      CREATE TABLE "channel_links" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "channel_id" uuid NOT NULL,
        "type" "channel_links_type_enum" NOT NULL,
        "label" character varying(50),
        "url" text NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channel_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_channel_links_channel_id"
          FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE
      )
    `);

    // 채널 홈 조회 시 channel_id로 링크를 정렬해 가져오는 경로 최적화
    await queryRunner.query(`
      CREATE INDEX "IDX_channel_links_channel_id_sort_order"
        ON "channel_links" ("channel_id", "sort_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_channel_links_channel_id_sort_order"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "channel_links"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "channel_links_type_enum"`);

    await queryRunner.query(`
      ALTER TABLE "channels"
        DROP CONSTRAINT IF EXISTS "FK_channels_banner_media_id",
        DROP CONSTRAINT IF EXISTS "FK_channels_profile_media_id",
        DROP COLUMN IF EXISTS "banner_media_id",
        DROP COLUMN IF EXISTS "profile_media_id",
        DROP COLUMN IF EXISTS "description"
    `);
  }
}
