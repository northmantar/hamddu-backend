import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { XpController } from "./xp.controller";
import { XpService } from "./xp.service";
import { XpWallet } from "@entities/xp-wallet.entity";
import { XpTransaction } from "@entities/xp-transaction.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";
import { User } from "@entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([XpWallet, XpTransaction, XpLevelPolicy, User]),
  ],
  controllers: [XpController],
  providers: [XpService],
  exports: [XpService],
})
export class XpModule {}
