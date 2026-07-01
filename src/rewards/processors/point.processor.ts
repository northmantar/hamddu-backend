import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { POINT_QUEUE } from '../constants/reward.constants';
import { RewardJobPayload } from '../dto/reward-job.dto';
import { PointsService } from '../../points/points.service';
import { PointEarningPolicy } from '@entities/point-earning-policy.entity';
import { PointActionTypeEntity } from '@entities/point-action-type.entity';
import { PointTransaction } from '@entities/point-transaction.entity';
import { RedisService } from '../../redis/redis.service';

/**
 * 데이터 주도 포인트 지급 (ref/reward-policy-v2.md §5)
 *  - (refType, refAction) → 활성 카탈로그 → 활성 정책 N개 → 전부 지급
 *  - isOneTime = 유저 평생 1회: dedup (memberId, policyId)
 *  - 반복형: 같은 이벤트(refId) 재처리만 방지: dedup (memberId, policyId, refId)
 *  - metadata.pointApplyable === false 이면 포인트 스킵 (도메인 조건은 발행 시점 metadata 로 전달)
 */
@Processor(POINT_QUEUE)
export class PointProcessor extends WorkerHost {
  private readonly logger = new Logger(PointProcessor.name);

  constructor(
    private readonly pointsService: PointsService,
    private readonly redis: RedisService,
    @InjectRepository(PointActionTypeEntity)
    private readonly actionTypeRepo: Repository<PointActionTypeEntity>,
    @InjectRepository(PointEarningPolicy)
    private readonly policyRepo: Repository<PointEarningPolicy>,
    @InjectRepository(PointTransaction)
    private readonly txRepo: Repository<PointTransaction>,
  ) {
    super();
  }

  async process(job: Job<RewardJobPayload>): Promise<void> {
    const { memberId, refType, refAction, refId, metadata } = job.data;

    // 도메인 조건: 발행 측에서 pointApplyable=false 를 명시하면 포인트 미지급 (XP 는 별개)
    if (metadata?.pointApplyable === false) return;

    // 1) 카탈로그 매칭 — 보상 대상 이벤트인지
    const catalog = await this.actionTypeRepo.findOne({
      where: { refType, refAction, isActive: true },
    });
    if (!catalog) return; // 보상 대상 아님 → no-op

    // 2) 활성 정책 (N개 모두 지급)
    const policies = await this.policyRepo.find({
      where: { actionType: catalog.code, isActive: true },
    });
    if (policies.length === 0) return;

    const description = `${catalog.labelKo} 보상`;

    for (const policy of policies) {
      try {
        if (await this.alreadyRewarded(policy, memberId, refType, refId)) continue;

        await this.pointsService.earn({
          memberId,
          policyId: policy.id,
          refType,
          refId,
          description,
        });

        await this.markDone(policy, memberId, refType, refId);
      } catch (error) {
        this.logger.error(
          `Point earn failed (policy=${policy.id}, job=${job.id}): ${(error as Error).message}`,
        );
        throw error; // 잡 재시도
      }
    }
  }

  /** 멱등 체크: 평생1회는 (member, policy), 반복형은 (member, policy, refId) */
  private async alreadyRewarded(
    policy: PointEarningPolicy,
    memberId: string,
    refType: string,
    refId: string,
  ): Promise<boolean> {
    if (await this.redis.get(this.redisKey(policy, memberId, refType, refId))) {
      return true;
    }
    const where = policy.isOneTime
      ? { memberId, policyId: policy.id }
      : { memberId, policyId: policy.id, refId };
    const existing = await this.txRepo.findOne({ where });
    return !!existing;
  }

  private async markDone(
    policy: PointEarningPolicy,
    memberId: string,
    refType: string,
    refId: string,
  ): Promise<void> {
    // 평생1회는 길게(30일) — Redis 는 빠른 경로일 뿐, 최종 권위는 DB
    const ttl = policy.isOneTime ? 86400 * 30 : 86400;
    await this.redis.set(this.redisKey(policy, memberId, refType, refId), '1', ttl);
  }

  private redisKey(
    policy: PointEarningPolicy,
    memberId: string,
    refType: string,
    refId: string,
  ): string {
    return policy.isOneTime
      ? `reward:point:once:${policy.id}:${memberId}`
      : `reward:point:done:${policy.id}:${refType}:${refId}`;
  }
}
