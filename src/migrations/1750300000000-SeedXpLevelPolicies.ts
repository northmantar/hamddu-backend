import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * XP 지갑 최초 생성 시 레벨 1 정책이 반드시 필요한데(XpService.earn → 지갑 부트스트랩),
 * 시드가 없어 "레벨 정책이 설정되지 않았습니다." 로 보상 적립이 실패하던 문제를 해소한다.
 * 기본 레벨 사다리를 시드하되, 어드민(누적 XP 레벨)에서 수정/추가 가능하도록 ON CONFLICT 로 멱등 처리.
 */
export class SeedXpLevelPolicies1750300000000 implements MigrationInterface {
  name = "SeedXpLevelPolicies1750300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "xp_level_policies" ("level", "xp_threshold", "label", "is_active") VALUES
        (1, 0,    '새싹 뜨개러', true),
        (2, 100,  '초보 뜨개러', true),
        (3, 300,  '중급 뜨개러', true),
        (4, 700,  '고급 뜨개러', true),
        (5, 1500, '마스터 뜨개러', true)
      ON CONFLICT ("level") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "xp_level_policies" WHERE "level" IN (1, 2, 3, 4, 5)
    `);
  }
}
