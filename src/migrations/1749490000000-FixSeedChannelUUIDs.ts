import { MigrationInterface, QueryRunner } from "typeorm";

const OLD_KNITTING = 'c0000001-0000-0000-0000-000000000001';
const OLD_CROCHET  = 'c0000002-0000-0000-0000-000000000002';
const NEW_KNITTING = '09c808ce-40bf-4569-8ac5-e43372a6679b';
const NEW_CROCHET  = 'a2d037f2-2d60-4c9c-a794-0bb7d0be8352';

export class FixSeedChannelUUIDs1749490000000 implements MigrationInterface {
  name = "FixSeedChannelUUIDs1749490000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 새 UUID로 채널 복사
    await queryRunner.query(`
      INSERT INTO "channels" ("id", "name", "platform", "source_channel_id", "status", "added_at")
      SELECT '${NEW_KNITTING}', "name", "platform", "source_channel_id", "status", "added_at"
      FROM "channels" WHERE "id" = '${OLD_KNITTING}'
    `);
    await queryRunner.query(`
      INSERT INTO "channels" ("id", "name", "platform", "source_channel_id", "status", "added_at")
      SELECT '${NEW_CROCHET}', "name", "platform", "source_channel_id", "status", "added_at"
      FROM "channels" WHERE "id" = '${OLD_CROCHET}'
    `);

    // contents의 channel_id 업데이트
    await queryRunner.query(`
      UPDATE "contents" SET "channel_id" = '${NEW_KNITTING}' WHERE "channel_id" = '${OLD_KNITTING}'
    `);
    await queryRunner.query(`
      UPDATE "contents" SET "channel_id" = '${NEW_CROCHET}' WHERE "channel_id" = '${OLD_CROCHET}'
    `);

    // 구 채널 삭제
    await queryRunner.query(`DELETE FROM "channels" WHERE "id" = '${OLD_KNITTING}'`);
    await queryRunner.query(`DELETE FROM "channels" WHERE "id" = '${OLD_CROCHET}'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "channels" ("id", "name", "platform", "source_channel_id", "status", "added_at")
      SELECT '${OLD_KNITTING}', "name", "platform", "source_channel_id", "status", "added_at"
      FROM "channels" WHERE "id" = '${NEW_KNITTING}'
    `);
    await queryRunner.query(`
      INSERT INTO "channels" ("id", "name", "platform", "source_channel_id", "status", "added_at")
      SELECT '${OLD_CROCHET}', "name", "platform", "source_channel_id", "status", "added_at"
      FROM "channels" WHERE "id" = '${NEW_CROCHET}'
    `);

    await queryRunner.query(`
      UPDATE "contents" SET "channel_id" = '${OLD_KNITTING}' WHERE "channel_id" = '${NEW_KNITTING}'
    `);
    await queryRunner.query(`
      UPDATE "contents" SET "channel_id" = '${OLD_CROCHET}' WHERE "channel_id" = '${NEW_CROCHET}'
    `);

    await queryRunner.query(`DELETE FROM "channels" WHERE "id" = '${NEW_KNITTING}'`);
    await queryRunner.query(`DELETE FROM "channels" WHERE "id" = '${NEW_CROCHET}'`);
  }
}
