import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POINT_QUEUE, XP_QUEUE } from './constants/reward.constants';
import { RewardsService } from './rewards.service';
import { PointProcessor } from './processors/point.processor';
import { XpProcessor } from './processors/xp.processor';
import { PointsModule } from '../points/points.module';
import { XpModule } from '../xp/xp.module';
import { PointEarningPolicy } from '@entities/point-earning-policy.entity';
import { PointTransaction } from '@entities/point-transaction.entity';
import { XpTransaction } from '@entities/xp-transaction.entity';

const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 86400 * 7, count: 1000 },
  removeOnFail: { age: 86400 * 30 },
};

@Module({
  imports: [
    BullModule.registerQueue(
      { name: POINT_QUEUE, defaultJobOptions: JOB_OPTIONS },
      { name: XP_QUEUE,    defaultJobOptions: JOB_OPTIONS },
    ),
    TypeOrmModule.forFeature([PointEarningPolicy, PointTransaction, XpTransaction]),
    PointsModule,
    XpModule,
  ],
  providers: [RewardsService, PointProcessor, XpProcessor],
  exports: [RewardsService],
})
export class RewardsModule {}
