import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContentImageUrlAndNormalType1748900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "content_type_enum" ADD VALUE IF NOT EXISTS 'normal'
    `);

    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD COLUMN IF NOT EXISTS "image_url" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contents" DROP COLUMN IF EXISTS "image_url"
    `);

    // PostgreSQL은 enum 값 제거를 직접 지원하지 않으므로 타입을 재생성
    await queryRunner.query(`
      ALTER TYPE "content_type_enum" RENAME TO "content_type_enum_old"
    `);
    await queryRunner.query(`
      CREATE TYPE "content_type_enum" AS ENUM ('symbol', 'free')
    `);
    await queryRunner.query(`
      ALTER TABLE "contents"
      ALTER COLUMN "type" TYPE "content_type_enum"
      USING "type"::text::"content_type_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "content_type_enum_old"
    `);
  }
}
