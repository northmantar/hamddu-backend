import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNicknameBasesTable1745280001000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "nickname_bases" (
        "baseNickname" text NOT NULL,
        "nextSuffix" bigint NOT NULL DEFAULT 2,
        CONSTRAINT "PK_nickname_bases" PRIMARY KEY ("baseNickname")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nickname_bases"`);
  }
}
