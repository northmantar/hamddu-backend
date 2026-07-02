import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RewardsService } from './rewards.service';
import { POINT_QUEUE, XP_QUEUE } from './constants/reward.constants';
import { RewardAction } from './constants/reward-events';
import { RewardJobPayload } from './dto/reward-job.dto';

describe('RewardsService', () => {
  let service: RewardsService;
  let pointQueue: jest.Mocked<Queue>;
  let xpQueue: jest.Mocked<Queue>;

  const mockPayload: RewardJobPayload = {
    memberId: 'user-123',
    refType: 'challenge',
    refAction: RewardAction.CREATE,
    refId: 'challenge-abc',
    metadata: { pointApplyable: true },
  };

  beforeEach(async () => {
    const mockPointQueue = { add: jest.fn().mockResolvedValue({}) };
    const mockXpQueue    = { add: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: getQueueToken(POINT_QUEUE), useValue: mockPointQueue },
        { provide: getQueueToken(XP_QUEUE),    useValue: mockXpQueue },
      ],
    }).compile();

    service    = module.get(RewardsService);
    pointQueue = module.get(getQueueToken(POINT_QUEUE));
    xpQueue    = module.get(getQueueToken(XP_QUEUE));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueReward', () => {
    it('should add jobs to both point and xp queues', async () => {
      await service.enqueueReward(mockPayload);

      expect(pointQueue.add).toHaveBeenCalledTimes(1);
      expect(xpQueue.add).toHaveBeenCalledTimes(1);
    });

    it('should use deterministic job IDs based on refType and refId', async () => {
      await service.enqueueReward(mockPayload);

      expect(pointQueue.add).toHaveBeenCalledWith(
        'earn',
        mockPayload,
        { jobId: 'point:challenge:challenge-abc' },
      );
      expect(xpQueue.add).toHaveBeenCalledWith(
        'earn',
        mockPayload,
        { jobId: 'xp:challenge:challenge-abc' },
      );
    });

    it('should pass the full payload to both queues', async () => {
      const watchPayload: RewardJobPayload = {
        memberId: 'user-456',
        refType: 'tutorial_watch',
        refAction: RewardAction.CREATE,
        refId: 'wh-abc',
        metadata: { contentId: 'content-1', pointApplyable: false },
      };

      await service.enqueueReward(watchPayload);

      expect(pointQueue.add).toHaveBeenCalledWith('earn', watchPayload, expect.any(Object));
      expect(xpQueue.add).toHaveBeenCalledWith('earn', watchPayload, expect.any(Object));
    });

    it('should enqueue both jobs in parallel', async () => {
      const order: string[] = [];
      pointQueue.add.mockImplementation(async () => { order.push('point'); return {} as any; });
      xpQueue.add.mockImplementation(async () => { order.push('xp'); return {} as any; });

      await service.enqueueReward(mockPayload);

      // 순서 무관하게 둘 다 호출됨
      expect(order).toContain('point');
      expect(order).toContain('xp');
    });
  });
});
