import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { POINT_QUEUE, RewardActionType } from '../constants/reward.constants';
import { RewardJobPayload } from '../dto/reward-job.dto';
import { PointsService } from '../../points/points.service';
import { PointEarningPolicy } from '@entities/point-earning-policy.entity';
import { PointTransaction } from '@entities/point-transaction.entity';
import { PointActionType } from '@enums/point.enum';
import { RedisService } from '../../redis/redis.service';

const ACTION_TYPE_MAP: Partial<Record<RewardActionType, PointActionType>> = {
  [RewardActionType.CHALLENGE_CREATED]: PointActionType.CHALLENGE,
  [RewardActionType.VIDEO_WATCHED]:     PointActionType.WATCH,
  [RewardActionType.COMMENT_CREATED]:   PointActionType.COMMENT,
};

@Processor(POINT_QUEUE)
export class PointProcessor extends WorkerHost {
  private readonly logger = new Logger(PointProcessor.name);

  constructor(
    private readonly pointsService: PointsService,
    private readonly redis: RedisService,
    @InjectRepository(PointEarningPolicy)
    private readonly policyRepo: Repository<PointEarningPolicy>,
    @InjectRepository(PointTransaction)
    private readonly txRepo: Repository<PointTransaction>,
  ) {
    super();
  }

  async process(job: Job<RewardJobPayload>): Promise<void> {
    const { memberId, actionType, refId, refType, metadata } = job.data;

    // VIDEO_WATCHED의 경우 content.pointApplyable 체크
    if (actionType === RewardActionType.VIDEO_WATCHED && !metadata?.pointApplyable) {
      return;
    }

    const pointActionType = ACTION_TYPE_MAP[actionType];
    if (!pointActionType) {
      // BOARD_CREATED 등 포인트 정책이 없는 액션 타입 — skip
      return;
    }

    // Layer 1: Redis 빠른 경로
    const idempotencyKey = `reward:point:done:${refType}:${refId}`;
    const alreadyDone = await this.redis.get(idempotencyKey);
    if (alreadyDone) return;

    // 활성화된 정책 조회
    const policy = await this.policyRepo.findOne({
      where: { actionType: pointActionType, isActive: true },
    });
    if (!policy) return;

    // Layer 2: DB 중복 체크 (isOneTime 정책)
    if (policy.isOneTime) {
      const existing = await this.txRepo.findOne({
        where: { memberId, policyId: policy.id, refId },
      });
      if (existing) return;
    }

    try {
      await this.pointsService.earn({
        memberId,
        policyId: policy.id,
        refType,
        refId,
        description: this.buildDescription(actionType),
      });

      // 처리 완료 마킹 (24시간 TTL)
      await this.redis.set(idempotencyKey, '1', 86400);
    } catch (error) {
      this.logger.error(`Point earn failed for job ${job.id}: ${(error as Error).message}`);
      throw error;
    }
  }

  private buildDescription(actionType: RewardActionType): string {
    const map: Record<RewardActionType, string> = {
      [RewardActionType.CHALLENGE_CREATED]: '챌린지 완료 보상',
      [RewardActionType.VIDEO_WATCHED]:     '영상 시청 완료 보상',
      [RewardActionType.BOARD_CREATED]:     '게시글 작성 보상',
      [RewardActionType.COMMENT_CREATED]:   '댓글 작성 보상',
    };
    return map[actionType];
  }
}
