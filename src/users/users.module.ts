import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { AdminGuard } from "../common/guards/admin.guard";
import { User } from "@entities/user.entity";
import { XpWallet } from "@entities/xp-wallet.entity";
import { PointWallet } from "@entities/point-wallet.entity";
import { NicknameAdjective } from "@entities/nickname-adjective.entity";
import { NicknameNoun } from "@entities/nickname-noun.entity";
import { NicknamesModule } from "../nicknames/nicknames.module";
import { RewardsModule } from "../rewards/rewards.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, XpWallet, PointWallet, NicknameAdjective, NicknameNoun]),
    NicknamesModule,
    RewardsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, AdminGuard],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
