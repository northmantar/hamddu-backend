import { MigrationInterface, QueryRunner } from 'typeorm';

const CHANNEL_KNITTING_ID = 'c0000001-0000-0000-0000-000000000001';
const CHANNEL_CROCHET_ID  = 'c0000002-0000-0000-0000-000000000002';

export class SeedDummyData1747100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── 채널 ────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "channels" ("id", "name", "youtube_channel_id", "added_at")
      VALUES
        ('${CHANNEL_KNITTING_ID}', '대바늘 튜토리얼', 'UC_placeholder_knitting', NOW()),
        ('${CHANNEL_CROCHET_ID}',  '코바늘 튜토리얼', 'UC_placeholder_crochet',  NOW())
      ON CONFLICT DO NOTHING
    `);

    // ── 대바늘 튜토리얼 콘텐츠 ─────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "contents"
        ("channel_id", "youtube_video_id", "name", "type", "interests", "sort_order", "point_applyable", "uploaded_at", "created_at", "updated_at")
      VALUES
        ('${CHANNEL_KNITTING_ID}', 'OEyHKadY2ts', '코 잡기',       'symbol', 'knitting', 1, true, NOW(), NOW(), NOW()),
        ('${CHANNEL_KNITTING_ID}', 'WZu0d9sDkmU', '겉뜨기',        'symbol', 'knitting', 2, true, NOW(), NOW(), NOW()),
        ('${CHANNEL_KNITTING_ID}', 'f0Ki0bFBuHw', '안뜨기',        'symbol', 'knitting', 3, true, NOW(), NOW(), NOW()),
        ('${CHANNEL_KNITTING_ID}', 'GM9-iZZxjhw', '고무뜨기',      'symbol', 'knitting', 4, true, NOW(), NOW(), NOW()),
        ('${CHANNEL_KNITTING_ID}', '5V7YEv6Wmws', '메리야스 뜨기', 'symbol', 'knitting', 5, true, NOW(), NOW(), NOW()),
        ('${CHANNEL_KNITTING_ID}', 'VoGVs8DuPg8', '가터뜨기',      'symbol', 'knitting', 6, true, NOW(), NOW(), NOW()),
        ('${CHANNEL_KNITTING_ID}', 'KCI5VS5yu2k', '코 막기',       'symbol', 'knitting', 7, true, NOW(), NOW(), NOW())
      ON CONFLICT ("youtube_video_id") DO NOTHING
    `);

    // ── 코바늘 튜토리얼 콘텐츠 (링크 있는 것만, 원래 순서 유지) ──
    await queryRunner.query(`
      INSERT INTO "contents"
        ("channel_id", "youtube_video_id", "name", "type", "interests", "sort_order", "point_applyable", "uploaded_at", "created_at", "updated_at")
      VALUES
        ('${CHANNEL_CROCHET_ID}', 'ohk5XIV8TTQ', '매직링 만들기', 'symbol', 'crochet', 1, true, NOW(), NOW(), NOW()),
        ('${CHANNEL_CROCHET_ID}', 'v_tqq8Xd1FM', '사슬뜨기',     'symbol', 'crochet', 2, true, NOW(), NOW(), NOW()),
        ('${CHANNEL_CROCHET_ID}', 'N9nmlUrBsWQ', '팝콘뜨기',     'symbol', 'crochet', 9, true, NOW(), NOW(), NOW())
      ON CONFLICT ("youtube_video_id") DO NOTHING
    `);

    // ── 게시판 카테고리 ─────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "board_categories" ("label", "status", "created_at")
      VALUES
        ('뜨개 결과물 자랑',             'enabled', NOW()),
        ('뜨개 지식 공유',               'enabled', NOW()),
        ('뜨개 관련 사담',               'enabled', NOW()),
        ('뜨개 관련 장소/장비/스토어 추천', 'enabled', NOW()),
        ('자유',                         'enabled', NOW())
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "contents"
      WHERE "youtube_video_id" IN (
        'OEyHKadY2ts','WZu0d9sDkmU','f0Ki0bFBuHw','GM9-iZZxjhw',
        '5V7YEv6Wmws','VoGVs8DuPg8','KCI5VS5yu2k',
        'ohk5XIV8TTQ','v_tqq8Xd1FM','N9nmlUrBsWQ'
      )
    `);

    await queryRunner.query(`
      DELETE FROM "channels"
      WHERE "id" IN ('${CHANNEL_KNITTING_ID}', '${CHANNEL_CROCHET_ID}')
    `);

    await queryRunner.query(`
      DELETE FROM "board_categories"
      WHERE "label" IN (
        '뜨개 결과물 자랑', '뜨개 지식 공유', '뜨개 관련 사담',
        '뜨개 관련 장소/장비/스토어 추천', '자유'
      )
    `);
  }
}
