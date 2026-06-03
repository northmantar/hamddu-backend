import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTables1747000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for users table
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_status_enum" AS ENUM ('active', 'withdrawn');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_type_enum" AS ENUM ('admin', 'member');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_platform_enum" AS ENUM ('naver', 'google');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_age_enum" AS ENUM ('1418', '1924', '2529', '3034', '3539', '4049', '50+');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_gender_enum" AS ENUM ('M', 'F');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_interests_enum" AS ENUM ('crochet', 'knitting');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_ability_enum" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "status" "users_status_enum" NOT NULL DEFAULT 'active',
        "type" "users_type_enum" NOT NULL DEFAULT 'member',
        "platform_user_id" varchar,
        "platform" "users_platform_enum",
        "email" varchar,
        "password" varchar,
        "name" varchar,
        "nickname" varchar(30),
        "age" "users_age_enum",
        "gender" "users_gender_enum",
        "interests" "users_interests_enum",
        "ability" "users_ability_enum",
        "survey_completed_at" TIMESTAMP WITH TIME ZONE,
        "withdrawn_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_platform_platform_user_id" UNIQUE ("platform", "platform_user_id"),
        CONSTRAINT "UQ_users_email_type" UNIQUE ("email", "type"),
        CONSTRAINT "UQ_users_nickname" UNIQUE ("nickname"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create other enum types
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
        "youtube_channel_id" varchar NOT NULL,
        "added_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_channels_youtube_channel_id" UNIQUE ("youtube_channel_id"),
        CONSTRAINT "PK_channels" PRIMARY KEY ("id")
      )
    `);

    // Create contents table
    await queryRunner.query(`
      CREATE TABLE "contents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "channel_id" uuid,
        "youtube_video_id" varchar NOT NULL,
        "name" varchar(255) NOT NULL,
        "type" "content_type_enum" NOT NULL,
        "interests" "users_interests_enum",
        "sort_order" int,
        "previous_content_id" uuid,
        "next_content_id" uuid,
        "point_applyable" boolean NOT NULL DEFAULT false,
        "uploaded_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_contents_youtube_video_id" UNIQUE ("youtube_video_id"),
        CONSTRAINT "PK_contents" PRIMARY KEY ("id")
      )
    `);

    // Create watch_histories table
    await queryRunner.query(`
      CREATE TABLE "watch_histories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "member_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "total_duration" int NOT NULL,
        "last_watched_timestamp" time NOT NULL,
        "watch_rate" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_watched_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_watch_histories_member_content" UNIQUE ("member_id", "content_id"),
        CONSTRAINT "PK_watch_histories" PRIMARY KEY ("id")
      )
    `);

    // Create challenges table
    await queryRunner.query(`
      CREATE TABLE "challenges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "member_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "title" text,
        "body" text,
        "image_url" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_challenges_member_content" UNIQUE ("member_id", "content_id"),
        CONSTRAINT "PK_challenges" PRIMARY KEY ("id")
      )
    `);

    // Create board_categories table
    await queryRunner.query(`
      CREATE TABLE "board_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "label" varchar(100) NOT NULL,
        "status" "board_category_status_enum" NOT NULL DEFAULT 'enabled',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_categories" PRIMARY KEY ("id")
      )
    `);

    // Create boards table
    await queryRunner.query(`
      CREATE TABLE "boards" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "status" "board_status_enum" NOT NULL DEFAULT 'published',
        "member_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "title" text NOT NULL,
        "body" text NOT NULL,
        "like_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_boards" PRIMARY KEY ("id")
      )
    `);

    // Create board_likes table
    await queryRunner.query(`
      CREATE TABLE "board_likes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "board_id" uuid NOT NULL,
        "member_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_board_likes_board_member" UNIQUE ("board_id", "member_id"),
        CONSTRAINT "PK_board_likes" PRIMARY KEY ("id")
      )
    `);

    // Create board_comments table
    await queryRunner.query(`
      CREATE TABLE "board_comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "board_id" uuid NOT NULL,
        "member_id" uuid NOT NULL,
        "parent_id" uuid,
        "body" text NOT NULL,
        "depth" int NOT NULL DEFAULT 0,
        "like_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_board_comments" PRIMARY KEY ("id")
      )
    `);

    // Create board_comment_likes table
    await queryRunner.query(`
      CREATE TABLE "board_comment_likes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "comment_id" uuid NOT NULL,
        "member_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_board_comment_likes_comment_member" UNIQUE ("comment_id", "member_id"),
        CONSTRAINT "PK_board_comment_likes" PRIMARY KEY ("id")
      )
    `);

    // Create point_earning_policies table
    await queryRunner.query(`
      CREATE TABLE "point_earning_policies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "action_type" "point_action_type_enum" NOT NULL,
        "point_amount" int NOT NULL,
        "is_one_time" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_point_earning_policies" PRIMARY KEY ("id")
      )
    `);

    // Create point_wallets table
    await queryRunner.query(`
      CREATE TABLE "point_wallets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "member_id" uuid NOT NULL,
        "balance" int NOT NULL DEFAULT 0,
        "total_earned" int NOT NULL DEFAULT 0,
        "total_used" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_point_wallets_member_id" UNIQUE ("member_id"),
        CONSTRAINT "PK_point_wallets" PRIMARY KEY ("id")
      )
    `);

    // Create point_transactions table
    await queryRunner.query(`
      CREATE TABLE "point_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "member_id" uuid NOT NULL,
        "policy_id" uuid,
        "wallet_id" uuid,
        "ref_id" uuid,
        "ref_type" varchar,
        "cancel_target_id" uuid,
        "type" "point_transaction_type_enum" NOT NULL,
        "status" "point_transaction_status_enum" NOT NULL DEFAULT 'COMPLETED',
        "description" text,
        "amount" int NOT NULL,
        "expired_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_point_transactions" PRIMARY KEY ("id")
      )
    `);

    // Create point_use_details table
    await queryRunner.query(`
      CREATE TABLE "point_use_details" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "use_tx_id" uuid NOT NULL,
        "earn_tx_id" uuid NOT NULL,
        "consumed_amount" int NOT NULL,
        CONSTRAINT "PK_point_use_details" PRIMARY KEY ("id")
      )
    `);

    // Create xp_level_policies table
    await queryRunner.query(`
      CREATE TABLE "xp_level_policies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "level" int NOT NULL,
        "xp_threshold" int NOT NULL,
        "label" varchar(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_xp_level_policies_level" UNIQUE ("level"),
        CONSTRAINT "PK_xp_level_policies" PRIMARY KEY ("id")
      )
    `);

    // Create xp_wallets table
    await queryRunner.query(`
      CREATE TABLE "xp_wallets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "member_id" uuid NOT NULL,
        "policy_id" uuid NOT NULL,
        "total_xp" int NOT NULL DEFAULT 0,
        "current_level" int NOT NULL DEFAULT 1,
        "xp_to_next_level" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_xp_wallets_member_id" UNIQUE ("member_id"),
        CONSTRAINT "PK_xp_wallets" PRIMARY KEY ("id")
      )
    `);

    // Create xp_transactions table
    await queryRunner.query(`
      CREATE TABLE "xp_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "member_id" uuid NOT NULL,
        "wallet_id" uuid NOT NULL,
        "policy_id" uuid NOT NULL,
        "ref_id" uuid,
        "ref_type" varchar,
        "amount" int NOT NULL,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_xp_transactions" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD CONSTRAINT "FK_contents_channel_id"
      FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD CONSTRAINT "FK_contents_previous_content_id"
      FOREIGN KEY ("previous_content_id") REFERENCES "contents"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "contents"
      ADD CONSTRAINT "FK_contents_next_content_id"
      FOREIGN KEY ("next_content_id") REFERENCES "contents"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "watch_histories"
      ADD CONSTRAINT "FK_watch_histories_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "watch_histories"
      ADD CONSTRAINT "FK_watch_histories_content_id"
      FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "challenges"
      ADD CONSTRAINT "FK_challenges_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "challenges"
      ADD CONSTRAINT "FK_challenges_content_id"
      FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "boards"
      ADD CONSTRAINT "FK_boards_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "boards"
      ADD CONSTRAINT "FK_boards_category_id"
      FOREIGN KEY ("category_id") REFERENCES "board_categories"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_likes"
      ADD CONSTRAINT "FK_board_likes_board_id"
      FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_likes"
      ADD CONSTRAINT "FK_board_likes_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_comments"
      ADD CONSTRAINT "FK_board_comments_board_id"
      FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_comments"
      ADD CONSTRAINT "FK_board_comments_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_comments"
      ADD CONSTRAINT "FK_board_comments_parent_id"
      FOREIGN KEY ("parent_id") REFERENCES "board_comments"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_comment_likes"
      ADD CONSTRAINT "FK_board_comment_likes_comment_id"
      FOREIGN KEY ("comment_id") REFERENCES "board_comments"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "board_comment_likes"
      ADD CONSTRAINT "FK_board_comment_likes_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "point_wallets"
      ADD CONSTRAINT "FK_point_wallets_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "point_transactions"
      ADD CONSTRAINT "FK_point_transactions_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "point_transactions"
      ADD CONSTRAINT "FK_point_transactions_policy_id"
      FOREIGN KEY ("policy_id") REFERENCES "point_earning_policies"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "point_transactions"
      ADD CONSTRAINT "FK_point_transactions_wallet_id"
      FOREIGN KEY ("wallet_id") REFERENCES "point_wallets"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "point_transactions"
      ADD CONSTRAINT "FK_point_transactions_cancel_target_id"
      FOREIGN KEY ("cancel_target_id") REFERENCES "point_transactions"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "point_use_details"
      ADD CONSTRAINT "FK_point_use_details_use_tx_id"
      FOREIGN KEY ("use_tx_id") REFERENCES "point_transactions"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "point_use_details"
      ADD CONSTRAINT "FK_point_use_details_earn_tx_id"
      FOREIGN KEY ("earn_tx_id") REFERENCES "point_transactions"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_wallets"
      ADD CONSTRAINT "FK_xp_wallets_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_wallets"
      ADD CONSTRAINT "FK_xp_wallets_policy_id"
      FOREIGN KEY ("policy_id") REFERENCES "xp_level_policies"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions"
      ADD CONSTRAINT "FK_xp_transactions_member_id"
      FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions"
      ADD CONSTRAINT "FK_xp_transactions_wallet_id"
      FOREIGN KEY ("wallet_id") REFERENCES "xp_wallets"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "xp_transactions"
      ADD CONSTRAINT "FK_xp_transactions_policy_id"
      FOREIGN KEY ("policy_id") REFERENCES "xp_level_policies"("id") ON DELETE CASCADE
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_contents_channel_id" ON "contents" ("channel_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_contents_type" ON "contents" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_watch_histories_member_id" ON "watch_histories" ("member_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_watch_histories_content_id" ON "watch_histories" ("content_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_challenges_member_id" ON "challenges" ("member_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_challenges_content_id" ON "challenges" ("content_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_boards_member_id" ON "boards" ("member_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_boards_category_id" ON "boards" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_boards_status" ON "boards" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_comments_board_id" ON "board_comments" ("board_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_comments_parent_id" ON "board_comments" ("parent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_point_transactions_member_id" ON "point_transactions" ("member_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_point_transactions_type" ON "point_transactions" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_xp_transactions_member_id" ON "xp_transactions" ("member_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_xp_transactions_member_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_point_transactions_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_point_transactions_member_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_comments_parent_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_board_comments_board_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boards_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boards_category_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boards_member_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_challenges_content_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_challenges_member_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watch_histories_content_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_watch_histories_member_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contents_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contents_channel_id"`);

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

    await queryRunner.query(`DROP TYPE IF EXISTS "point_action_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "point_transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "point_transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "board_category_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "board_status_enum"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "users_ability_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_interests_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_gender_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_age_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_platform_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_status_enum"`);
  }
}
