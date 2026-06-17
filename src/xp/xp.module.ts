import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { XpController } from "./xp.controller";
import { XpService } from "./xp.service";
import { XpWallet } from "@entities/xp-wallet.entity";
import { XpTransaction } from "@entities/xp-transaction.entity";
import { XpLevelPolicy } from "@entities/xp-level-policy.entity";
import { XpEarningPolicy } from "@entities/xp-earning-policy.entity";
import { XpActionTypeEntity } from "@entities/xp-action-type.entity";
import { User } from "@entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      XpWallet,
      XpTransaction,
      XpLevelPolicy,
      XpEarningPolicy,
      XpActionTypeEntity,
      User,
    ]),
  ],
  controllers: [XpController],
  providers: [XpService],
  exports: [XpService],
})
export class XpModule {}
