import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 시청 보상을 "모든 영상 시청 기록 생성"이 아니라 "튜토리얼(symbol) 시청 완료" 논리 이벤트로 재정의.
 * 기존 WATCH 카탈로그를 (watch_history, CREATE) → (tutorial_watch, CREATE) 로 리타깃 + 라벨 정정.
 * emit 도 tutorial_watch + content.type=symbol 조건으로 변경됨. (ref/reward-policy-v2.md §14)
 */
export class RetargetWatchCatalogToTutorial1750600000000 implements MigrationInterface {
  name = "RetargetWatchCatalogToTutorial1750600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "point_action_types"
      SET "ref_type" = 'tutorial_watch', "label_ko" = '튜토리얼 시청 완료'
      WHERE "code" = 'WATCH'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "point_action_types"
      SET "ref_type" = 'watch_history', "label_ko" = '시청'
      WHERE "code" = 'WATCH'
    `);
  }
}
