import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommentReportsAndHiddenFields1749450000000
  implements MigrationInterface
{
  name = "AddCommentReportsAndHiddenFields1749450000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // boards 테이블에 is_hidden 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE "boards" ADD COLUMN "isHidden" boolean NOT NULL DEFAULT false
    `);

    // board_comments 테이블에 is_hidden 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE "board_comments" ADD COLUMN "isHidden" boolean NOT NULL DEFAULT false
    `);

    // comment_reports 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "comment_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "commentId" uuid NOT NULL,
        "reporterId" uuid NOT NULL,
        "reason" "report_reason_enum" NOT NULL,
        "description" text,
        "status" "report_status_enum" NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "processedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_comment_reports" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_comment_reports_comment_reporter" UNIQUE ("commentId", "reporterId"),
        CONSTRAINT "FK_comment_reports_comment" FOREIGN KEY ("commentId") REFERENCES "board_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_comment_reports_reporter" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // 인덱스 생성
    await queryRunner.query(`
      CREATE INDEX "IDX_comment_reports_commentId" ON "comment_reports" ("commentId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_comment_reports_status" ON "comment_reports" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_comment_reports_createdAt" ON "comment_reports" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 인덱스 삭제
    await queryRunner.query(`DROP INDEX "IDX_comment_reports_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_comment_reports_status"`);
    await queryRunner.query(`DROP INDEX "IDX_comment_reports_commentId"`);

    // comment_reports 테이블 삭제
    await queryRunner.query(`DROP TABLE "comment_reports"`);

    // board_comments 테이블에서 is_hidden 컬럼 삭제
    await queryRunner.query(`
      ALTER TABLE "board_comments" DROP COLUMN "isHidden"
    `);

    // boards 테이블에서 is_hidden 컬럼 삭제
    await queryRunner.query(`
      ALTER TABLE "boards" DROP COLUMN "isHidden"
    `);
  }
}
