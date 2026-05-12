import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTables1747000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "board_status_enum" AS ENUM ('draft', 'published', 'deleted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "board_category_status_enum" AS ENUM ('enabled', 'disabled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "content_type_enum" AS ENUM ('symbol', 'free');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "point_transaction_type_enum" AS ENUM ('EARN', 'USE', 'CANCEL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "point_transaction_status_enum" AS ENUM ('COMPLETED', 'CANCEL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "point_action_type_enum" AS ENUM ('WATCH', 'CHALLENGE', 'COMMENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create channels table
    await queryRunner.query(`
      CREATE TABLE "channels" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "youtubeChannelId" varchar NOT NULL,
        "addedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_channels_youtubeChannelId" UNIQUE ("youtubeChannelId"),
        CONSTRAINT "PK_channels" PRIMARY KEY ("id")
      )
    `);

    // Create contents table
    await queryRunner.query(`
      CREATE TABLE "contents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "channelId" uuid NOT NULL,
        "youtubeVideoId" varchar NOT NULL,
        "name" varchar(255) NOT NULL,
        "type" "content_type_enum" NOT NULL,
        "interests" "user_interests_enum",
        "previousContentId" uuid,
        "nextContentId" uuid,
        "pointApplyable" boolean NOT NULL DEFAULT false,
        "uploadedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_contents_youtubeVideoId" UNIQUE ("youtubeVideoId"),
        CONSTRAINT "PK_contents" PRIMARY KEY ("id")
      )
    `);

    // Create watch_histories table
    await queryRunner.query(`
      CREATE TABLE "watch_histories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "memberId" uuid NOT NULL,
        "contentId" uuid NOT NULL,
        "totalDuration" int NOT NULL,
        "lastWatchedTimestamp" time NOT NULL,
        "watchRate" int NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "lastWatchedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_watch_histories_member_content" UNIQUE ("memberId", "contentId"),
        CONSTRAINT "PK_watch_histories" PRIMARY KEY ("id")
      )
    `);

    // Create challenges table
    await queryRunner.query(`
      CREATE TABLE "challenges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "memberId" uuid NOT NULL,
        "contentId" uuid NOT NULL,
        "title" text,
        "body" text,
        "imageUrl" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_challenges_member_content" UNIQUE ("memberId", "contentId"),
        CONSTRAINT "PK_challenges" PRIMARY KEY ("id")
      )
    `);

    // Create board_categories table
    await queryRunner.query(`
      CREATE TABLE "board_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "label" varchar(100) NOT NULL,
        "status" "board_category_status_enum" NOT NULL DEFAULT 'enabled',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_categories" PRIMARY KEY ("id")
      )
    `);

    // Create boards table
    await queryRunner.query(`
      CREATE TABLE "boards" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "status" "board_status_enum" NOT NULL DEFAULT 'published',
        "memberId" uuid NOT NULL,
        "categoryId" uuid NOT NULL,
        "title" text NOT NULL,
        "body" text NOT NULL,
        "likeCount" int NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_boards" PRIMARY KEY ("id")
      )
    `);

    // Create board_likes table
    await queryRunner.query(`
      CREATE TABLE "board_likes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "boardId" uuid NOT NULL,
        "memberId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_board_likes_board_member" UNIQUE ("boardId", "memberId"),
        CONSTRAINT "PK_board_likes" PRIMARY KEY ("id")
      )
    `);

    // Create board_comments table
    await queryRunner.query(`
      CREATE TABLE "board_comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "boardId" uuid NOT NULL,
        "memberId" uuid NOT NULL,
        "parentId" uuid,
        "body" text NOT NULL,
        "depth" int NOT NULL DEFAULT 0,
        "likeCount" int NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_board_comments" PRIMARY KEY ("id")
      )
    `);

    // Create board_comment_likes table
    await queryRunner.query(`
      CREATE TABLE "board_comment_likes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "commentId" uuid NOT NULL,
        "memberId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_board_comment_likes_comment_member" UNIQUE ("commentId", "memberId"),
        CONSTRAINT "PK_board_comment_likes" PRIMARY KEY ("id")
      )
    `);

    // Create point_earning_policies table
    await queryRunner.query(`
      CREATE TABLE "point_earning_policies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "actionType" "point_action_type_enum" NOT NULL,
        "pointAmount" int NOT NULL,
        "isOneTime" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_point_earning_policies" PRIMARY KEY ("id")
      )
    `);

    // Create point_wallets table
    await queryRunner.query(`
      CREATE TABLE "point_wallets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "memberId" uuid NOT NULL,
        "balance" int NOT NULL DEFAULT 0,
        "totalEarned" int NOT NULL DEFAULT 0,
        "totalUsed" int NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_point_wallets_memberId" UNIQUE ("memberId"),
        CONSTRAINT "PK_point_wallets" PRIMARY KEY ("id")
      )
    `);

    // Create point_transactions table
    await queryRunner.query(`
      CREATE TABLE "point_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "memberId" uuid NOT NULL,
        "policyId" uuid,
        "walletId" uuid,
        "refId" uuid,
        "refType" varchar,
        "cancelTargetId" uuid,
        "type" "point_transaction_type_enum" NOT NULL,
        "status" "point_transaction_status_enum" NOT NULL DEFAULT 'COMPLETED',
        "description" text,
        "amount" int NOT NULL,
        "expiredAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_point_transactions" PRIMARY KEY ("id")
      )
    `);

    // Create point_use_details table
    await queryRunner.query(`
      CREATE TABLE "point_use_details" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "useTxId" uuid NOT NULL,
        "earnTxId" uuid NOT NULL,
        "consumedAmount" int NOT NULL,
        CONSTRAINT "PK_point_use_details" PRIMARY KEY ("id")
      )
    `);

    // Create xp_level_policies table
    await queryRunner.query(`
      CREATE TABLE "xp_level_policies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "level" int NOT NULL,
        "xpThreshold" int NOT NULL,
        "label" varchar(100) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_xp_level_policies_level" UNIQUE ("level"),
        CONSTRAINT "PK_xp_level_policies" PRIMARY KEY ("id")
      )
    `);

    // Create xp_wallets table
    await queryRunner.query(`
      CREATE TABLE "xp_wallets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "memberId" uuid NOT NULL,
        "policyId" uuid NOT NULL,
        "totalXp" int NOT NULL DEFAULT 0,
        "currentLevel" int NOT NULL DEFAULT 1,
        "xpToNextLevel" int NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_xp_wallets_memberId" UNIQUE ("memberId"),
        CONSTRAINT "PK_xp_wallets" PRIMARY KEY ("id")
      )
    `);

    // Create xp_transactions table
    await queryRunner.query(`
      CREATE TABLE "xp_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "memberId" uuid NOT NULL,
        "walletId" uuid NOT NULL,
        "policyId" uuid NOT NULL,
        "refId" uuid,
        "refType" varchar,
        "amount" int NOT NULL,
        "description" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_xp_transactions" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys
    // Contents
    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD CONSTRAINT "FK_contents_channelId"
      FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD CONSTRAINT "FK_contents_previousContentId"
      FOREIGN KEY ("previousContentId") REFERENCES "contents"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD CONSTRAINT "FK_contents_nextContentId"
      FOREIGN KEY ("nextContentId") REFERENCES "contents"("id") ON DELETE SET NULL
    `);

    // Watch histories
    await queryRunner.query(`
      ALTER TABLE "watch_histories"
      ADD CONSTRAINT "FK_watch_histories_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "watch_histories"
      ADD CONSTRAINT "FK_watch_histories_contentId"
      FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE
    `);

    // Challenges
    await queryRunner.query(`
      ALTER TABLE "challenges"
      ADD CONSTRAINT "FK_challenges_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "challenges"
      ADD CONSTRAINT "FK_challenges_contentId"
      FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE
    `);

    // Boards
    await queryRunner.query(`
      ALTER TABLE "boards"
      ADD CONSTRAINT "FK_boards_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "boards"
      ADD CONSTRAINT "FK_boards_categoryId"
      FOREIGN KEY ("categoryId") REFERENCES "board_categories"("id") ON DELETE CASCADE
    `);

    // Board likes
    await queryRunner.query(`
      ALTER TABLE "board_likes"
      ADD CONSTRAINT "FK_board_likes_boardId"
      FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_likes"
      ADD CONSTRAINT "FK_board_likes_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Board comments
    await queryRunner.query(`
      ALTER TABLE "board_comments"
      ADD CONSTRAINT "FK_board_comments_boardId"
      FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_comments"
      ADD CONSTRAINT "FK_board_comments_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_comments"
      ADD CONSTRAINT "FK_board_comments_parentId"
      FOREIGN KEY ("parentId") REFERENCES "board_comments"("id") ON DELETE CASCADE
    `);

    // Board comment likes
    await queryRunner.query(`
      ALTER TABLE "board_comment_likes"
      ADD CONSTRAINT "FK_board_comment_likes_commentId"
      FOREIGN KEY ("commentId") REFERENCES "board_comments"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_comment_likes"
      ADD CONSTRAINT "FK_board_comment_likes_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Point wallets
    await queryRunner.query(`
      ALTER TABLE "point_wallets"
      ADD CONSTRAINT "FK_point_wallets_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Point transactions
    await queryRunner.query(`
      ALTER TABLE "point_transactions"
      ADD CONSTRAINT "FK_point_transactions_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "point_transactions"
      ADD CONSTRAINT "FK_point_transactions_policyId"
      FOREIGN KEY ("policyId") REFERENCES "point_earning_policies"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "point_transactions"
      ADD CONSTRAINT "FK_point_transactions_walletId"
      FOREIGN KEY ("walletId") REFERENCES "point_wallets"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "point_transactions"
      ADD CONSTRAINT "FK_point_transactions_cancelTargetId"
      FOREIGN KEY ("cancelTargetId") REFERENCES "point_transactions"("id") ON DELETE SET NULL
    `);

    // Point use details
    await queryRunner.query(`
      ALTER TABLE "point_use_details"
      ADD CONSTRAINT "FK_point_use_details_useTxId"
      FOREIGN KEY ("useTxId") REFERENCES "point_transactions"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "point_use_details"
      ADD CONSTRAINT "FK_point_use_details_earnTxId"
      FOREIGN KEY ("earnTxId") REFERENCES "point_transactions"("id") ON DELETE CASCADE
    `);

    // XP wallets
    await queryRunner.query(`
      ALTER TABLE "xp_wallets"
      ADD CONSTRAINT "FK_xp_wallets_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_wallets"
      ADD CONSTRAINT "FK_xp_wallets_policyId"
      FOREIGN KEY ("policyId") REFERENCES "xp_level_policies"("id") ON DELETE CASCADE
    `);

    // XP transactions
    await queryRunner.query(`
      ALTER TABLE "xp_transactions"
      ADD CONSTRAINT "FK_xp_transactions_memberId"
      FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions"
      ADD CONSTRAINT "FK_xp_transactions_walletId"
      FOREIGN KEY ("walletId") REFERENCES "xp_wallets"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions"
      ADD CONSTRAINT "FK_xp_transactions_policyId"
      FOREIGN KEY ("policyId") REFERENCES "xp_level_policies"("id") ON DELETE CASCADE
    `);

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX "IDX_contents_channelId" ON "contents" ("channelId")`);
    await queryRunner.query(`CREATE INDEX "IDX_contents_type" ON "contents" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_watch_histories_memberId" ON "watch_histories" ("memberId")`);
    await queryRunner.query(`CREATE INDEX "IDX_watch_histories_contentId" ON "watch_histories" ("contentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_challenges_memberId" ON "challenges" ("memberId")`);
    await queryRunner.query(`CREATE INDEX "IDX_challenges_contentId" ON "challenges" ("contentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_boards_memberId" ON "boards" ("memberId")`);
    await queryRunner.query(`CREATE INDEX "IDX_boards_categoryId" ON "boards" ("categoryId")`);
    await queryRunner.query(`CREATE INDEX "IDX_boards_status" ON "boards" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_comments_boardId" ON "board_comments" ("boardId")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_comments_parentId" ON "board_comments" ("parentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_point_transactions_memberId" ON "point_transactions" ("memberId")`);
    await queryRunner.query(`CREATE INDEX "IDX_point_transactions_type" ON "point_transactions" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_xp_transactions_memberId" ON "xp_transactions" ("memberId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_xp_transactions_memberId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_point_transactions_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_point_transactions_memberId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_comments_parentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_comments_boardId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boards_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boards_categoryId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boards_memberId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_challenges_contentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_challenges_memberId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watch_histories_contentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watch_histories_memberId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contents_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contents_channelId"`);

    // Drop tables in reverse order of creation (respecting foreign key dependencies)
    await queryRunner.query(`DROP TABLE IF EXISTS "xp_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "xp_wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "xp_level_policies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "point_use_details"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "point_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "point_wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "point_earning_policies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "board_comment_likes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "board_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "board_likes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "boards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "board_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "challenges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "watch_histories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "channels"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "point_action_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "point_transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "point_transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "board_category_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "board_status_enum"`);
  }
}
