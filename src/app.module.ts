import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RedisModule } from "./redis/redis.module";
import { User } from "./entities/user.entity";
import { NicknameAdjective } from "./entities/nickname-adjective.entity";
import { NicknameNoun } from "./entities/nickname-noun.entity";
import { NicknameBase } from "./entities/nickname-base.entity";
import { NicknamesModule } from './nicknames/nicknames.module';

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
        entities: [User, NicknameAdjective, NicknameNoun, NicknameBase],
        // synchronize: false,
        synchronize: true,    // TODO: false
        namingStrategy: new SnakeNamingStrategy(),
        // migrations: ['src/migrations/*.ts'],
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    NicknamesModule,
  ],
})
export class AppModule {}
