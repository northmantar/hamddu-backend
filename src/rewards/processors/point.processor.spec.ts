import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { PointProcessor } from './point.processor';
import { PointsService } from '../../points/points.service';
import { RedisService } from '../../redis/redis.service';
import { PointEarningPolicy } from '@entities/point-earning-policy.entity';
import { PointActionTypeEntity } from '@entities/point-action-type.entity';
import { PointTransaction } from '@entities/point-transaction.entity';
import { RewardAction } from '../constants/reward-events';
import { RewardJobPayload } from '../dto/reward-job.dto';

function makeJob(data: RewardJobPayload): Job<RewardJobPayload> {
  return { id: 'job-1', data } as Job<RewardJobPayload>;
}

describe('PointProcessor (data-driven)', () => {
  let processor: PointProcessor;
  let pointsService: jest.Mocked<PointsService>;
  let redis: jest.Mocked<RedisService>;
  let actionTypeRepo: jest.Mocked<Repository<PointActionTypeEntity>>;
  let policyRepo: jest.Mocked<Repository<PointEarningPolicy>>;
  let txRepo: jest.Mocked<Repository<PointTransaction>>;

  const watchCatalog: Partial<PointActionTypeEntity> = {
    code: 'WATCH',
    labelKo: '영상 시청',
    refType: 'watch_history',
    refAction: RewardAction.CREATE,
    isActive: true,
  };

  const challengeCatalog: Partial<PointActionTypeEntity> = {
    code: 'CHALLENGE',
    labelKo: '챌린지',
    refType: 'challenge',
    refAction: RewardAction.CREATE,
    isActive: true,
  };

  const repeatablePolicy: Partial<PointEarningPolicy> = {
    id: 'policy-watch',
    actionType: 'WATCH',
    pointAmount: 30,
    isOneTime: false,
    isActive: true,
  };

  const oneTimePolicy: Partial<PointEarningPolicy> = {
    id: 'policy-challenge',
    actionType: 'CHALLENGE',
    pointAmount: 100,
    isOneTime: true,
    isActive: true,
  };

  const watchJob = (pointApplyable = true) =>
    makeJob({
      memberId: 'user-1',
      refType: 'watch_history',
      refAction: RewardAction.CREATE,
      refId: 'wh-1',
      metadata: { pointApplyable },
    });

  const challengeJob = () =>
    makeJob({
      memberId: 'user-1',
      refType: 'challenge',
      refAction: RewardAction.CREATE,
      refId: 'ch-1',
      metadata: { pointApplyable: true },
    });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointProcessor,
        {
          provide: PointsService,
          useValue: { earn: jest.fn().mockResolvedValue({ transaction: {}, newBalance: 100 }) },
        },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn() } },
        { provide: getRepositoryToken(PointActionTypeEntity), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(PointEarningPolicy), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(PointTransaction), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    processor = module.get(PointProcessor);
    pointsService = module.get(PointsService);
    redis = module.get(RedisService);
    actionTypeRepo = module.get(getRepositoryToken(PointActionTypeEntity));
    policyRepo = module.get(getRepositoryToken(PointEarningPolicy));
    txRepo = module.get(getRepositoryToken(PointTransaction));
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('도메인 조건 게이트', () => {
    it('pointApplyable=false 면 카탈로그 조회 없이 스킵', async () => {
      await processor.process(watchJob(false));
      expect(actionTypeRepo.findOne).not.toHaveBeenCalled();
      expect(pointsService.earn).not.toHaveBeenCalled();
    });
  });

  describe('카탈로그 매칭', () => {
    it('활성 카탈로그가 없으면 no-op (보상 대상 아님)', async () => {
      actionTypeRepo.findOne.mockResolvedValue(null);
      await processor.process(
        makeJob({ memberId: 'user-1', refType: 'board', refAction: RewardAction.CREATE, refId: 'b-1' }),
      );
      expect(pointsService.earn).not.toHaveBeenCalled();
    });
  });

  describe('활성 정책', () => {
    it('활성 정책이 없으면 스킵', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as PointActionTypeEntity);
      policyRepo.find.mockResolvedValue([]);
      await processor.process(challengeJob());
      expect(pointsService.earn).not.toHaveBeenCalled();
    });

    it('매칭되는 활성 정책 N개를 모두 지급', async () => {
      actionTypeRepo.findOne.mockResolvedValue(watchCatalog as PointActionTypeEntity);
      policyRepo.find.mockResolvedValue([
        { ...repeatablePolicy, id: 'p1' } as PointEarningPolicy,
        { ...repeatablePolicy, id: 'p2' } as PointEarningPolicy,
      ]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);

      await processor.process(watchJob());

      expect(pointsService.earn).toHaveBeenCalledTimes(2);
    });
  });

  describe('멱등', () => {
    it('Redis 키가 있으면 스킵', async () => {
      actionTypeRepo.findOne.mockResolvedValue(watchCatalog as PointActionTypeEntity);
      policyRepo.find.mockResolvedValue([repeatablePolicy as PointEarningPolicy]);
      redis.get.mockResolvedValue('1');

      await processor.process(watchJob());

      expect(pointsService.earn).not.toHaveBeenCalled();
    });

    it('isOneTime: 기존 트랜잭션 있으면 스킵 + (member, policy) 로 조회', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as PointActionTypeEntity);
      policyRepo.find.mockResolvedValue([oneTimePolicy as PointEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue({ id: 'existing' } as PointTransaction);

      await processor.process(challengeJob());

      expect(txRepo.findOne).toHaveBeenCalledWith({
        where: { memberId: 'user-1', policyId: 'policy-challenge' },
      });
      expect(pointsService.earn).not.toHaveBeenCalled();
    });

    it('반복형: (member, policy, refId) 로 조회 (같은 이벤트 재처리 방지)', async () => {
      actionTypeRepo.findOne.mockResolvedValue(watchCatalog as PointActionTypeEntity);
      policyRepo.find.mockResolvedValue([repeatablePolicy as PointEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);

      await processor.process(watchJob());

      expect(txRepo.findOne).toHaveBeenCalledWith({
        where: { memberId: 'user-1', policyId: 'policy-watch', refId: 'wh-1' },
      });
    });
  });

  describe('지급', () => {
    it('isOneTime 최초 지급 — 설명은 label_ko 기반, once 키 세팅', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as PointActionTypeEntity);
      policyRepo.find.mockResolvedValue([oneTimePolicy as PointEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);

      await processor.process(challengeJob());

      expect(pointsService.earn).toHaveBeenCalledWith({
        memberId: 'user-1',
        policyId: 'policy-challenge',
        refType: 'challenge',
        refId: 'ch-1',
        description: '챌린지 보상',
      });
      expect(redis.set).toHaveBeenCalledWith(
        'reward:point:once:policy-challenge:user-1',
        '1',
        86400 * 30,
      );
    });

    it('반복형 지급 — done 키(policyId 포함) 세팅', async () => {
      actionTypeRepo.findOne.mockResolvedValue(watchCatalog as PointActionTypeEntity);
      policyRepo.find.mockResolvedValue([repeatablePolicy as PointEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);

      await processor.process(watchJob());

      expect(pointsService.earn).toHaveBeenCalledWith({
        memberId: 'user-1',
        policyId: 'policy-watch',
        refType: 'watch_history',
        refId: 'wh-1',
        description: '영상 시청 보상',
      });
      expect(redis.set).toHaveBeenCalledWith(
        'reward:point:done:policy-watch:watch_history:wh-1',
        '1',
        86400,
      );
    });

    it('earn 실패 시 재시도되도록 throw', async () => {
      actionTypeRepo.findOne.mockResolvedValue(watchCatalog as PointActionTypeEntity);
      policyRepo.find.mockResolvedValue([repeatablePolicy as PointEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);
      (pointsService.earn as jest.Mock).mockRejectedValue(new Error('DB down'));

      await expect(processor.process(watchJob())).rejects.toThrow('DB down');
    });
  });
});
