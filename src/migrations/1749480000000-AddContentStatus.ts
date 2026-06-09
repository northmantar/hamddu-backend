import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContentStatus1749480000000 implements MigrationInterface {
  name = "AddContentStatus1749480000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "content_status_enum" AS ENUM ('active', 'inactive');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD COLUMN "status" "content_status_enum" NOT NULL DEFAULT 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contents" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_status_enum"`);
  }
}
