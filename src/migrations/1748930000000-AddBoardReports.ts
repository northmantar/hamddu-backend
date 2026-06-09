import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBoardReports1748930000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create report_reason enum
    await queryRunner.query(`
      CREATE TYPE "report_reason_enum" AS ENUM ('spam', 'harassment', 'inappropriate', 'copyright', 'other')
    `);

    // Create report_status enum
    await queryRunner.query(`
      CREATE TYPE "report_status_enum" AS ENUM ('pending', 'resolved', 'rejected')
    `);

    // Create board_reports table
    await queryRunner.query(`
      CREATE TABLE "board_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "board_id" uuid NOT NULL,
        "reporter_id" uuid NOT NULL,
        "reason" "report_reason_enum" NOT NULL,
        "description" text,
        "status" "report_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "processed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_board_reports" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_board_reports_board_reporter" UNIQUE ("board_id", "reporter_id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "board_reports"
      ADD CONSTRAINT "FK_board_reports_board_id"
      FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "board_reports"
      ADD CONSTRAINT "FK_board_reports_reporter_id"
      FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_board_reports_board_id" ON "board_reports" ("board_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_reports_status" ON "board_reports" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_reports_created_at" ON "board_reports" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_reports_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_reports_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_reports_board_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "board_reports"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "report_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_reason_enum"`);
  }
}
