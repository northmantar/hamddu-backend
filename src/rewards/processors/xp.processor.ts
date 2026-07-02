import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { XP_QUEUE } from '../constants/reward.constants';
import { RewardJobPayload } from '../dto/reward-job.dto';
import { XpService } from '../../xp/xp.service';
import { XpEarningPolicy } from '@entities/xp-earning-policy.entity';
import { XpActionTypeEntity } from '@entities/xp-action-type.entity';
import { XpTransaction } from '@entities/xp-transaction.entity';
import { RedisService } from '../../redis/redis.service';

/**
 * 데이터 주도 XP 지급 (ref/reward-policy-v2.md §5·§11)
 *  - (refType, refAction) → 활성 XP 카탈로그 → 활성 xp_earning_policies N개 → 전부 지급
 *  - xp_transaction 은 지급 정책 id 를 기록하지 않으므로 dedup 은 refType 기준:
 *      isOneTime = (memberId, refType) 평생 1회 / 반복형 = (memberId, refType, refId)
 *  - pointApplyable 은 포인트 전용 조건이므로 XP 는 무시.
 */
@Processor(XP_QUEUE)
export class XpProcessor extends WorkerHost {
  private readonly logger = new Logger(XpProcessor.name);

  constructor(
    private readonly xpService: XpService,
    private readonly redis: RedisService,
    @InjectRepository(XpActionTypeEntity)
    private readonly actionTypeRepo: Repository<XpActionTypeEntity>,
    @InjectRepository(XpEarningPolicy)
    private readonly policyRepo: Repository<XpEarningPolicy>,
    @InjectRepository(XpTransaction)
    private readonly txRepo: Repository<XpTransaction>,
  ) {
    super();
  }

  async process(job: Job<RewardJobPayload>): Promise<void> {
    const { memberId, refType, refAction, refId } = job.data;

    // 1) 카탈로그 매칭
    const catalog = await this.actionTypeRepo.findOne({
      where: { refType, refAction, isActive: true },
    });
    if (!catalog) return;

    // 2) 활성 정책 (N개 모두 지급)
    const policies = await this.policyRepo.find({
      where: { actionType: catalog.code, isActive: true },
    });
    if (policies.length === 0) return;

    const description = `${catalog.labelKo} 보상`;

    for (const policy of policies) {
      try {
        if (await this.alreadyRewarded(policy, memberId, refType, refId)) continue;

        const result = await this.xpService.earn({
          memberId,
          amount: policy.xpAmount,
          refType,
          refId,
          description,
        });

        await this.markDone(policy, memberId, refType, refId);

        if (result.leveledUp) {
          this.logger.log(`Level up! memberId=${memberId} → level ${result.newLevel}`);
        }
      } catch (error) {
        this.logger.error(
          `XP earn failed (policy=${policy.id}, job=${job.id}): ${(error as Error).message}`,
        );
        throw error;
      }
    }
  }

  private async alreadyRewarded(
    policy: XpEarningPolicy,
    memberId: string,
    refType: string,
    refId: string,
  ): Promise<boolean> {
    if (await this.redis.get(this.redisKey(policy, memberId, refType, refId))) {
      return true;
    }
    const where = policy.isOneTime
      ? { memberId, refType }
      : { memberId, refType, refId };
    const existing = await this.txRepo.findOne({ where });
    return !!existing;
  }

  private async markDone(
    policy: XpEarningPolicy,
    memberId: string,
    refType: string,
    refId: string,
  ): Promise<void> {
    const ttl = policy.isOneTime ? 86400 * 30 : 86400;
    await this.redis.set(this.redisKey(policy, memberId, refType, refId), '1', ttl);
  }

  private redisKey(
    policy: XpEarningPolicy,
    memberId: string,
    refType: string,
    refId: string,
  ): string {
    return policy.isOneTime
      ? `reward:xp:once:${refType}:${memberId}`
      : `reward:xp:done:${refType}:${refId}`;
  }
}
