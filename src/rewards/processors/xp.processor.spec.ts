import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { XpProcessor } from './xp.processor';
import { XpService } from '../../xp/xp.service';
import { XpTransaction } from '@entities/xp-transaction.entity';
import { RewardActionType, XP_AMOUNT_MAP } from '../constants/reward.constants';
import { RewardJobPayload } from '../dto/reward-job.dto';

function makeJob(data: RewardJobPayload): Job<RewardJobPayload> {
  return { id: 'job-1', data } as Job<RewardJobPayload>;
}

describe('XpProcessor', () => {
  let processor: XpProcessor;
  let xpService: jest.Mocked<XpService>;
  let txRepo: jest.Mocked<Repository<XpTransaction>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpProcessor,
        {
          provide: XpService,
          useValue: {
            earn: jest.fn().mockResolvedValue({
              transaction: {},
              newTotalXp: 50,
              newLevel: 1,
              leveledUp: false,
            }),
          },
        },
        {
          provide: getRepositoryToken(XpTransaction),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    processor = module.get(XpProcessor);
    xpService = module.get(XpService);
    txRepo    = module.get(getRepositoryToken(XpTransaction));
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('DB duplicate check', () => {
    it('should skip if XpTransaction with same memberId+refId+refType exists', async () => {
      txRepo.findOne.mockResolvedValue({ id: 'tx-existing' } as XpTransaction);

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'ch-1',
        refType: 'challenge',
      });

      await processor.process(job);

      expect(xpService.earn).not.toHaveBeenCalled();
    });

    it('should proceed if no prior transaction found', async () => {
      txRepo.findOne.mockResolvedValue(null);

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'ch-1',
        refType: 'challenge',
      });

      await processor.process(job);

      expect(xpService.earn).toHaveBeenCalled();
    });
  });

  describe('XP amount per action type', () => {
    const cases: [RewardActionType, string][] = [
      [RewardActionType.CHALLENGE_CREATED, 'challenge'],
      [RewardActionType.VIDEO_WATCHED,     'watch_history'],
      [RewardActionType.BOARD_CREATED,     'board'],
      [RewardActionType.COMMENT_CREATED,   'board_comment'],
    ];

    test.each(cases)('%s should award %s XP amount from map', async (actionType, refType) => {
      txRepo.findOne.mockResolvedValue(null);

      const job = makeJob({ memberId: 'user-1', actionType, refId: 'ref-1', refType });

      await processor.process(job);

      expect(xpService.earn).toHaveBeenCalledWith(
        expect.objectContaining({ amount: XP_AMOUNT_MAP[actionType] }),
      );
    });
  });

  describe('successful earn', () => {
    it('should call xpService.earn with correct params', async () => {
      txRepo.findOne.mockResolvedValue(null);

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.COMMENT_CREATED,
        refId: 'comment-1',
        refType: 'board_comment',
      });

      await processor.process(job);

      expect(xpService.earn).toHaveBeenCalledWith({
        memberId: 'user-1',
        amount: XP_AMOUNT_MAP[RewardActionType.COMMENT_CREATED],
        refType: 'board_comment',
        refId: 'comment-1',
        description: '댓글 작성 보상',
      });
    });

    it('should not throw on level-up (just logs)', async () => {
      txRepo.findOne.mockResolvedValue(null);
      (xpService.earn as jest.Mock).mockResolvedValue({
        transaction: {},
        newTotalXp: 200,
        newLevel: 2,
        leveledUp: true,
      });

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'ch-1',
        refType: 'challenge',
      });

      await expect(processor.process(job)).resolves.not.toThrow();
    });

    it('should re-throw error to trigger BullMQ retry', async () => {
      txRepo.findOne.mockResolvedValue(null);
      (xpService.earn as jest.Mock).mockRejectedValue(new Error('DB error'));

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'ch-1',
        refType: 'challenge',
      });

      await expect(processor.process(job)).rejects.toThrow('DB error');
    });
  });
});
