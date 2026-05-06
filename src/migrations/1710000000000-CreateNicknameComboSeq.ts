import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNicknameComboSeq1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS nickname_combo_seq
      START WITH 1
      INCREMENT BY 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP SEQUENCE IF EXISTS nickname_combo_seq
    `);
  }
}
