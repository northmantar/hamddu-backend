import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RedisModule } from "./redis/redis.module";
import { NicknamesModule } from "./nicknames/nicknames.module";
import { BoardsModule } from "./boards/boards.module";
import { ContentsModule } from "./contents/contents.module";
import { ChallengesModule } from "./challenges/challenges.module";
import { PointsModule } from "./points/points.module";
import { XpModule } from "./xp/xp.module";
import { ChannelsModule } from "./channels/channels.module";
import { RewardsModule } from "./rewards/rewards.module";
import { User } from "./entities/user.entity";
import { NicknameAdjective } from "./entities/nickname-adjective.entity";
import { NicknameNoun } from "./entities/nickname-noun.entity";
import { NicknameBase } from "./entities/nickname-base.entity";
import { Board } from "./entities/board.entity";
import { BoardLike } from "./entities/board-like.entity";
import { BoardCategory } from "./entities/board-category.entity";
import { BoardComment } from "./entities/board-comment.entity";
import { BoardCommentLike } from "./entities/board-comment-like.entity";
import { Channel } from "./entities/channel.entity";
import { Content } from "./entities/content.entity";
import { WatchHistory } from "./entities/watch-history.entity";
import { Challenge } from "./entities/challenge.entity";
import { PointWallet } from "./entities/point-wallet.entity";
import { PointTransaction } from "./entities/point-transaction.entity";
import { PointEarningPolicy } from "./entities/point-earning-policy.entity";
import { PointUseDetail } from "./entities/point-use-detail.entity";
import { XpWallet } from "./entities/xp-wallet.entity";
import { XpTransaction } from "./entities/xp-transaction.entity";
import { XpLevelPolicy } from "./entities/xp-level-policy.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_HOST"),
        port: config.get<number>("DB_PORT", 5432),
        username: config.get("DB_USER"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_NAME"),
        entities: [
          User,
          NicknameAdjective,
          NicknameNoun,
          NicknameBase,
          Board,
          BoardLike,
          BoardCategory,
          BoardComment,
          BoardCommentLike,
          Channel,
          Content,
          WatchHistory,
          Challenge,
          PointWallet,
          PointTransaction,
          PointEarningPolicy,
          PointUseDetail,
          XpWallet,
          XpTransaction,
          XpLevelPolicy,
        ],
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
        // migrations: ['src/migrations/*.ts'],
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    NicknamesModule,
    BoardsModule,
    ContentsModule,
    ChallengesModule,
    PointsModule,
    XpModule,
    ChannelsModule,
    RewardsModule,
  ],
})
export class AppModule {}
