import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * FCM 알림 기반 테이블 3종.
 *  - device_tokens: 유저 디바이스 FCM 토큰 (전체 브로드캐스트 topic 'all' 구독 대상)
 *  - notification_campaigns: 어드민 관리 공지(단발/예약) + 배치(반복/cron)
 *  - notification_templates: 이벤트성 알림 템플릿(현재 level_up 1종, 어드민 편집)
 */
export class NotificationTables1750900000000 implements MigrationInterface {
  name = "NotificationTables1750900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "device_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token" character varying NOT NULL,
        "platform" character varying(20),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_device_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_device_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_device_tokens_user_id" ON "device_tokens" ("user_id")`,
    );

    await queryRunner.query(
      `CREATE TYPE "notification_campaigns_type_enum" AS ENUM ('ANNOUNCEMENT', 'BATCH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notification_campaigns_status_enum" AS ENUM ('SCHEDULED', 'SENT', 'ACTIVE', 'PAUSED', 'CANCELED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "notification_campaigns" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" "notification_campaigns_type_enum" NOT NULL,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "scheduled_at" TIMESTAMP WITH TIME ZONE,
        "cron" character varying,
        "status" "notification_campaigns_status_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_campaigns" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notification_templates" (
        "key" character varying NOT NULL,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_templates" PRIMARY KEY ("key")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "notification_templates" ("key", "title", "body", "is_active")
      VALUES ('level_up', '레벨업! 🎉', '축하합니다! {label}(Lv.{level})에 도달했어요.', true)
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notification_templates"`);
    await queryRunner.query(`DROP TABLE "notification_campaigns"`);
    await queryRunner.query(`DROP TYPE "notification_campaigns_status_enum"`);
    await queryRunner.query(`DROP TYPE "notification_campaigns_type_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_device_tokens_user_id"`);
    await queryRunner.query(`DROP TABLE "device_tokens"`);
  }
}
