import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeletePhantomNicknameUsers1750000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // POST /nicknames/issue 가 닉네임 선점용으로 users 테이블에 직접 INSERT 하던 버그로 생성된
    // 유령 유저(닉네임만 있고 식별 정보가 전혀 없는 row)를 정리한다.
    // 정상 유저는 OAuth 식별자(platform/platform_user_id) 또는 email/password 중 하나를
    // 반드시 가지므로, 아래 조건은 유령 유저에만 매칭된다.
    await queryRunner.query(`
      DELETE FROM users
      WHERE nickname IS NOT NULL
        AND platform IS NULL
        AND platform_user_id IS NULL
        AND email IS NULL
        AND password IS NULL
    `);
  }

  public async down(): Promise<void> {
    // 데이터 삭제이므로 롤백할 수 없다 (no-op).
  }
}
