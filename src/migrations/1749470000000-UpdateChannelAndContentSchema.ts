import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateChannelAndContentSchema1749470000000
  implements MigrationInterface
{
  name = "UpdateChannelAndContentSchema1749470000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── channel_platform_enum 생성 ──────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "channel_platform_enum" AS ENUM ('youtube');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ── channel_status_enum 생성 ────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "channel_status_enum" AS ENUM ('active', 'inactive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ── channels: youtube_channel_id → source_channel_id ───────────
    await queryRunner.query(`
      ALTER TABLE "channels" RENAME COLUMN "youtube_channel_id" TO "source_channel_id"
    `);
    await queryRunner.query(`
      ALTER INDEX "UQ_channels_youtube_channel_id"
      RENAME TO "UQ_channels_source_channel_id"
    `);

    // ── channels: platform 컬럼 추가 (기존 데이터 youtube로 채움) ──
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN "platform" "channel_platform_enum" NOT NULL DEFAULT 'youtube'
    `);

    // ── channels: status 컬럼 추가 (기존 데이터 active로 채움) ─────
    await queryRunner.query(`
      ALTER TABLE "channels"
      ADD COLUMN "status" "channel_status_enum" NOT NULL DEFAULT 'active'
    `);

    // ── contents: youtube_video_id → source_video_id ────────────────
    await queryRunner.query(`
      ALTER TABLE "contents" RENAME COLUMN "youtube_video_id" TO "source_video_id"
    `);
    await queryRunner.query(`
      ALTER INDEX "UQ_contents_youtube_video_id"
      RENAME TO "UQ_contents_source_video_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER INDEX "UQ_contents_source_video_id"
      RENAME TO "UQ_contents_youtube_video_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "contents" RENAME COLUMN "source_video_id" TO "youtube_video_id"
    `);

    await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "platform"`);

    await queryRunner.query(`
      ALTER INDEX "UQ_channels_source_channel_id"
      RENAME TO "UQ_channels_youtube_channel_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "channels" RENAME COLUMN "source_channel_id" TO "youtube_channel_id"
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "channel_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "channel_platform_enum"`);
  }
}
