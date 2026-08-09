import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileImage1751200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "profile_media_id" uuid NULL,
        ADD CONSTRAINT "FK_users_profile_media_id"
          FOREIGN KEY ("profile_media_id") REFERENCES "media"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP CONSTRAINT IF EXISTS "FK_users_profile_media_id",
        DROP COLUMN IF EXISTS "profile_media_id"
    `);
  }
}
