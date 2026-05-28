import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { PointProcessor } from './point.processor';
import { PointsService } from '../../points/points.service';
import { RedisService } from '../../redis/redis.service';
import { PointEarningPolicy } from '@entities/point-earning-policy.entity';
import { PointTransaction } from '@entities/point-transaction.entity';
import { PointActionType } from '@enums/point.enum';
import { RewardActionType } from '../constants/reward.constants';
import { RewardJobPayload } from '../dto/reward-job.dto';

function makeJob(data: RewardJobPayload): Job<RewardJobPayload> {
  return { id: 'job-1', data } as Job<RewardJobPayload>;
}

describe('PointProcessor', () => {
  let processor: PointProcessor;
  let pointsService: jest.Mocked<PointsService>;
  let redis: jest.Mocked<RedisService>;
  let policyRepo: jest.Mocked<Repository<PointEarningPolicy>>;
  let txRepo: jest.Mocked<Repository<PointTransaction>>;

  const mockPolicy: Partial<PointEarningPolicy> = {
    id: 'policy-watch',
    actionType: PointActionType.WATCH,
    pointAmount: 30,
    isOneTime: false,
    isActive: true,
  };

  const mockChallengePolicy: Partial<PointEarningPolicy> = {
    id: 'policy-challenge',
    actionType: PointActionType.CHALLENGE,
    pointAmount: 100,
    isOneTime: true,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointProcessor,
        {
          provide: PointsService,
          useValue: { earn: jest.fn().mockResolvedValue({ transaction: {}, newBalance: 100 }) },
        },
        {
          provide: RedisService,
          useValue: { get: jest.fn(), set: jest.fn() },
        },
        {
          provide: getRepositoryToken(PointEarningPolicy),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(PointTransaction),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    processor    = module.get(PointProcessor);
    pointsService = module.get(PointsService);
    redis         = module.get(RedisService);
    policyRepo    = module.get(getRepositoryToken(PointEarningPolicy));
    txRepo        = module.get(getRepositoryToken(PointTransaction));
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('VIDEO_WATCHED — pointApplyable=false', () => {
    it('should skip earning when content is not point-applyable', async () => {
      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.VIDEO_WATCHED,
        refId: 'wh-1',
        refType: 'watch_history',
        metadata: { pointApplyable: false },
      });

      await processor.process(job);

      expect(pointsService.earn).not.toHaveBeenCalled();
    });
  });

  describe('BOARD_CREATED — no PointActionType mapping', () => {
    it('should skip earning because BOARD_CREATED has no point action type', async () => {
      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.BOARD_CREATED,
        refId: 'board-1',
        refType: 'board',
      });

      await processor.process(job);

      expect(pointsService.earn).not.toHaveBeenCalled();
    });
  });

  describe('Redis idempotency (Layer 1)', () => {
    it('should skip if Redis key already set', async () => {
      redis.get.mockResolvedValue('1');

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'ch-1',
        refType: 'challenge',
        metadata: { pointApplyable: true },
      });

      await processor.process(job);

      expect(pointsService.earn).not.toHaveBeenCalled();
    });
  });

  describe('no active policy', () => {
    it('should skip if no active policy for the action type', async () => {
      redis.get.mockResolvedValue(null);
      policyRepo.findOne.mockResolvedValue(null);

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'ch-1',
        refType: 'challenge',
        metadata: { pointApplyable: true },
      });

      await processor.process(job);

      expect(pointsService.earn).not.toHaveBeenCalled();
    });
  });

  describe('isOneTime — DB duplicate check (Layer 2)', () => {
    it('should skip if isOneTime and existing transaction found', async () => {
      redis.get.mockResolvedValue(null);
      policyRepo.findOne.mockResolvedValue(mockChallengePolicy as PointEarningPolicy);
      txRepo.findOne.mockResolvedValue({ id: 'existing-tx' } as PointTransaction);

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'ch-1',
        refType: 'challenge',
        metadata: { pointApplyable: true },
      });

      await processor.process(job);

      expect(pointsService.earn).not.toHaveBeenCalled();
    });

    it('should earn if isOneTime but no prior transaction exists', async () => {
      redis.get.mockResolvedValue(null);
      policyRepo.findOne.mockResolvedValue(mockChallengePolicy as PointEarningPolicy);
      txRepo.findOne.mockResolvedValue(null);
      redis.set.mockResolvedValue(undefined);

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'ch-1',
        refType: 'challenge',
        metadata: { pointApplyable: true },
      });

      await processor.process(job);

      expect(pointsService.earn).toHaveBeenCalledWith({
        memberId: 'user-1',
        policyId: 'policy-challenge',
        refType: 'challenge',
        refId: 'ch-1',
        description: '챌린지 완료 보상',
      });
    });
  });

  describe('successful earn', () => {
    it('should earn points and set Redis idempotency key', async () => {
      redis.get.mockResolvedValue(null);
      policyRepo.findOne.mockResolvedValue(mockPolicy as PointEarningPolicy);
      redis.set.mockResolvedValue(undefined);

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.VIDEO_WATCHED,
        refId: 'wh-1',
        refType: 'watch_history',
        metadata: { pointApplyable: true },
      });

      await processor.process(job);

      expect(pointsService.earn).toHaveBeenCalledWith({
        memberId: 'user-1',
        policyId: 'policy-watch',
        refType: 'watch_history',
        refId: 'wh-1',
        description: '영상 시청 완료 보상',
      });
      expect(redis.set).toHaveBeenCalledWith(
        'reward:point:done:watch_history:wh-1',
        '1',
        86400,
      );
    });

    it('should re-throw error to trigger BullMQ retry', async () => {
      redis.get.mockResolvedValue(null);
      policyRepo.findOne.mockResolvedValue(mockPolicy as PointEarningPolicy);
      (pointsService.earn as jest.Mock).mockRejectedValue(new Error('DB down'));

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.VIDEO_WATCHED,
        refId: 'wh-1',
        refType: 'watch_history',
        metadata: { pointApplyable: true },
      });

      await expect(processor.process(job)).rejects.toThrow('DB down');
    });
  });

  describe('non-isOneTime policy', () => {
    it('should skip DB duplicate check for non-isOneTime policy', async () => {
      redis.get.mockResolvedValue(null);
      policyRepo.findOne.mockResolvedValue(mockPolicy as PointEarningPolicy); // isOneTime: false
      redis.set.mockResolvedValue(undefined);

      const job = makeJob({
        memberId: 'user-1',
        actionType: RewardActionType.VIDEO_WATCHED,
        refId: 'wh-1',
        refType: 'watch_history',
        metadata: { pointApplyable: true },
      });

      await processor.process(job);

      // txRepo.findOne should NOT be called for non-isOneTime policies
      expect(txRepo.findOne).not.toHaveBeenCalled();
      expect(pointsService.earn).toHaveBeenCalled();
    });
  });
});
