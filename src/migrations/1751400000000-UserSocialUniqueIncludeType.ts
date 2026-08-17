import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 소셜 계정 유니크 제약에 type을 포함시킨다.
 * (email, type)과 동일하게, 같은 소셜 계정이 admin/member row로 공존할 수 있어야
 * 서비스 로그인이 어드민 row를 재사용하지 않고 별도 member로 가입된다.
 */
export class UserSocialUniqueIncludeType1751400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP CONSTRAINT IF EXISTS "UQ_users_platform_platform_user_id",
        ADD CONSTRAINT "UQ_users_platform_platform_user_id_type"
          UNIQUE ("platform", "platform_user_id", "type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP CONSTRAINT IF EXISTS "UQ_users_platform_platform_user_id_type",
        ADD CONSTRAINT "UQ_users_platform_platform_user_id"
          UNIQUE ("platform", "platform_user_id")
    `);
  }
}
