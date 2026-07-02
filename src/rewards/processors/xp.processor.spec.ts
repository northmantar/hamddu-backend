import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { XpProcessor } from './xp.processor';
import { XpService } from '../../xp/xp.service';
import { RedisService } from '../../redis/redis.service';
import { XpEarningPolicy } from '@entities/xp-earning-policy.entity';
import { XpActionTypeEntity } from '@entities/xp-action-type.entity';
import { XpTransaction } from '@entities/xp-transaction.entity';
import { RewardAction } from '../constants/reward-events';
import { RewardJobPayload } from '../dto/reward-job.dto';

function makeJob(data: RewardJobPayload): Job<RewardJobPayload> {
  return { id: 'job-1', data } as Job<RewardJobPayload>;
}

describe('XpProcessor (data-driven)', () => {
  let processor: XpProcessor;
  let xpService: jest.Mocked<XpService>;
  let redis: jest.Mocked<RedisService>;
  let actionTypeRepo: jest.Mocked<Repository<XpActionTypeEntity>>;
  let policyRepo: jest.Mocked<Repository<XpEarningPolicy>>;
  let txRepo: jest.Mocked<Repository<XpTransaction>>;

  const challengeCatalog: Partial<XpActionTypeEntity> = {
    code: 'CHALLENGE',
    labelKo: '챌린지 작성',
    refType: 'challenge',
    refAction: RewardAction.CREATE,
    isActive: true,
  };

  const signupCatalog: Partial<XpActionTypeEntity> = {
    code: 'USER_SIGNUP',
    labelKo: '회원가입',
    refType: 'users',
    refAction: RewardAction.CREATE,
    isActive: true,
  };

  const repeatablePolicy: Partial<XpEarningPolicy> = {
    id: 'xpol-ch',
    actionType: 'CHALLENGE',
    xpAmount: 50,
    isOneTime: false,
    isActive: true,
  };

  const oneTimePolicy: Partial<XpEarningPolicy> = {
    id: 'xpol-signup',
    actionType: 'USER_SIGNUP',
    xpAmount: 100,
    isOneTime: true,
    isActive: true,
  };

  const challengeJob = () =>
    makeJob({ memberId: 'user-1', refType: 'challenge', refAction: RewardAction.CREATE, refId: 'ch-1' });
  const signupJob = () =>
    makeJob({ memberId: 'user-1', refType: 'users', refAction: RewardAction.CREATE, refId: 'user-1' });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpProcessor,
        {
          provide: XpService,
          useValue: {
            earn: jest.fn().mockResolvedValue({
              transaction: {}, newTotalXp: 50, newLevel: 1, leveledUp: false,
            }),
          },
        },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn() } },
        { provide: getRepositoryToken(XpActionTypeEntity), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(XpEarningPolicy), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(XpTransaction), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    processor = module.get(XpProcessor);
    xpService = module.get(XpService);
    redis = module.get(RedisService);
    actionTypeRepo = module.get(getRepositoryToken(XpActionTypeEntity));
    policyRepo = module.get(getRepositoryToken(XpEarningPolicy));
    txRepo = module.get(getRepositoryToken(XpTransaction));
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('카탈로그/정책 매칭', () => {
    it('활성 카탈로그 없으면 no-op', async () => {
      actionTypeRepo.findOne.mockResolvedValue(null);
      await processor.process(challengeJob());
      expect(xpService.earn).not.toHaveBeenCalled();
    });

    it('활성 정책 없으면 스킵', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as XpActionTypeEntity);
      policyRepo.find.mockResolvedValue([]);
      await processor.process(challengeJob());
      expect(xpService.earn).not.toHaveBeenCalled();
    });

    it('활성 정책 N개 모두 지급', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as XpActionTypeEntity);
      policyRepo.find.mockResolvedValue([
        { ...repeatablePolicy, id: 'p1' } as XpEarningPolicy,
        { ...repeatablePolicy, id: 'p2' } as XpEarningPolicy,
      ]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);

      await processor.process(challengeJob());

      expect(xpService.earn).toHaveBeenCalledTimes(2);
    });
  });

  describe('멱등', () => {
    it('Redis 키 있으면 스킵', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as XpActionTypeEntity);
      policyRepo.find.mockResolvedValue([repeatablePolicy as XpEarningPolicy]);
      redis.get.mockResolvedValue('1');
      await processor.process(challengeJob());
      expect(xpService.earn).not.toHaveBeenCalled();
    });

    it('반복형: (member, refType, refId) 로 dedup', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as XpActionTypeEntity);
      policyRepo.find.mockResolvedValue([repeatablePolicy as XpEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);

      await processor.process(challengeJob());

      expect(txRepo.findOne).toHaveBeenCalledWith({
        where: { memberId: 'user-1', refType: 'challenge', refId: 'ch-1' },
      });
    });

    it('isOneTime: (member, refType) 로 dedup + 기존 있으면 스킵', async () => {
      actionTypeRepo.findOne.mockResolvedValue(signupCatalog as XpActionTypeEntity);
      policyRepo.find.mockResolvedValue([oneTimePolicy as XpEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue({ id: 'existing' } as XpTransaction);

      await processor.process(signupJob());

      expect(txRepo.findOne).toHaveBeenCalledWith({
        where: { memberId: 'user-1', refType: 'users' },
      });
      expect(xpService.earn).not.toHaveBeenCalled();
    });
  });

  describe('지급', () => {
    it('정책 금액·label_ko 설명으로 지급 + done 키 세팅', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as XpActionTypeEntity);
      policyRepo.find.mockResolvedValue([repeatablePolicy as XpEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);

      await processor.process(challengeJob());

      expect(xpService.earn).toHaveBeenCalledWith({
        memberId: 'user-1',
        amount: 50,
        refType: 'challenge',
        refId: 'ch-1',
        description: '챌린지 작성 보상',
      });
      expect(redis.set).toHaveBeenCalledWith(
        'reward:xp:done:challenge:ch-1',
        '1',
        86400,
      );
    });

    it('earn 실패 시 재시도되도록 throw', async () => {
      actionTypeRepo.findOne.mockResolvedValue(challengeCatalog as XpActionTypeEntity);
      policyRepo.find.mockResolvedValue([repeatablePolicy as XpEarningPolicy]);
      redis.get.mockResolvedValue(null);
      txRepo.findOne.mockResolvedValue(null);
      (xpService.earn as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(processor.process(challengeJob())).rejects.toThrow('DB error');
    });
  });
});
