import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { POINT_QUEUE, XP_QUEUE } from './constants/reward.constants';
import { RewardJobPayload } from './dto/reward-job.dto';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectQueue(POINT_QUEUE) private readonly pointQueue: Queue,
    @InjectQueue(XP_QUEUE)    private readonly xpQueue: Queue,
  ) {}

  async enqueueReward(payload: RewardJobPayload): Promise<void> {
    const jobId = `${payload.refType}:${payload.refId}`;

    await Promise.all([
      this.pointQueue.add('earn', payload, { jobId: `point:${jobId}` }),
      this.xpQueue.add('earn', payload,    { jobId: `xp:${jobId}` }),
    ]);

    this.logger.debug(`Reward enqueued: ${jobId} (${payload.refType}/${payload.refAction})`);
  }
}
