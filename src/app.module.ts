import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RedisModule } from "./redis/redis.module";
import { NicknamesModule } from "./nicknames/nicknames.module";
import { BoardsModule } from "./boards/boards.module";
import { ContentsModule } from "./contents/contents.module";
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        ],
        // synchronize: false,
        synchronize: true, // TODO: false
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
  ],
})
export class AppModule {}
