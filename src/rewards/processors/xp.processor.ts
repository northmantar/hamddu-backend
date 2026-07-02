import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { POINT_QUEUE, XP_QUEUE, XP_AMOUNT_MAP, RewardActionType } from '../constants/reward.constants';
import { RewardJobPayload } from '../dto/reward-job.dto';
import { XpService } from '../../xp/xp.service';
import { XpTransaction } from '@entities/xp-transaction.entity';

@Processor(XP_QUEUE)
export class XpProcessor extends WorkerHost {
  private readonly logger = new Logger(XpProcessor.name);

  constructor(
    private readonly xpService: XpService,
    @InjectRepository(XpTransaction)
    private readonly txRepo: Repository<XpTransaction>,
  ) {
    super();
  }

  async process(job: Job<RewardJobPayload>): Promise<void> {
    const { memberId, actionType, refId, refType } = job.data;

    const xpAmount = XP_AMOUNT_MAP[actionType];
    if (!xpAmount) return;

    // DB 중복 체크: (memberId, refId, refType) 조합으로 확인
    const existing = await this.txRepo.findOne({
      where: { memberId, refId, refType },
    });
    if (existing) return;

    try {
      const result = await this.xpService.earn({
        memberId,
        amount: xpAmount,
        refType,
        refId,
        description: this.buildDescription(actionType),
      });

      if (result.leveledUp) {
        this.logger.log(`Level up! memberId=${memberId} → level ${result.newLevel}`);
      }
    } catch (error) {
      this.logger.error(`XP earn failed for job ${job.id}: ${(error as Error).message}`);
      throw error;
    }
  }

  private buildDescription(actionType: RewardActionType): string {
    const map: Record<RewardActionType, string> = {
      [RewardActionType.CHALLENGE_CREATED]: '챌린지 완료 보상',
      [RewardActionType.VIDEO_WATCHED]:     '영상 시청 완료 보상',
      [RewardActionType.BOARD_CREATED]:     '게시글 작성 보상',
      [RewardActionType.COMMENT_CREATED]:   '댓글 작성 보상',
      [RewardActionType.USER_SIGNUP]:       '회원가입 보상',
    };
    return map[actionType];
  }
}
