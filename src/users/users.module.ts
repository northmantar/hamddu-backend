import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "@entities/user.entity";
import { NicknameAdjective } from "@entities/nickname-adjective.entity";
import { NicknameNoun } from "@entities/nickname-noun.entity";
import { NicknamesModule } from "../nicknames/nicknames.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, NicknameAdjective, NicknameNoun]),
    NicknamesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
