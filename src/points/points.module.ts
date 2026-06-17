import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PointsController } from "./points.controller";
import { PointsService } from "./points.service";
import { PointWallet } from "@entities/point-wallet.entity";
import { PointTransaction } from "@entities/point-transaction.entity";
import { PointEarningPolicy } from "@entities/point-earning-policy.entity";
import { PointActionTypeEntity } from "@entities/point-action-type.entity";
import { User } from "@entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PointWallet,
      PointTransaction,
      PointEarningPolicy,
      PointActionTypeEntity,
      User,
    ]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
