import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { Challenge } from '@entities/challenge.entity';
import { Content } from '@entities/content.entity';
import { RewardsService } from '../rewards/rewards.service';
import { RewardActionType } from '../rewards/constants/reward.constants';

describe('ChallengesService', () => {
  let service: ChallengesService;
  let challengeRepo: jest.Mocked<Repository<Challenge>>;
  let contentRepo: jest.Mocked<Repository<Content>>;
  let rewardsService: jest.Mocked<RewardsService>;

  const mockContent: Partial<Content> = {
    id: 'content-1',
    name: '코 잡기',
    pointApplyable: true,
  };

  const mockChallenge: Partial<Challenge> = {
    id: 'challenge-1',
    memberId: 'user-1',
    contentId: 'content-1',
    title: '첫 챌린지',
    body: '완료!',
    imageUrl: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        {
          provide: getRepositoryToken(Challenge),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockChallenge], 1]),
            })),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            existsBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Content),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: RewardsService,
          useValue: { enqueueReward: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service        = module.get(ChallengesService);
    challengeRepo  = module.get(getRepositoryToken(Challenge));
    contentRepo    = module.get(getRepositoryToken(Content));
    rewardsService = module.get(RewardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { contentId: 'content-1', title: '첫 챌린지', body: '완료!' };

    it('should throw NotFoundException if content not found', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.create('user-1', dto)).rejects.toThrow(NotFoundException);
      expect(rewardsService.enqueueReward).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if challenge already exists for this content', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
      challengeRepo.findOne.mockResolvedValueOnce(mockChallenge as Challenge); // existing check

      await expect(service.create('user-1', dto)).rejects.toThrow(ConflictException);
      expect(rewardsService.enqueueReward).not.toHaveBeenCalled();
    });

    it('should create challenge and enqueue reward', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
      challengeRepo.findOne
        .mockResolvedValueOnce(null)               // duplicate check → none
        .mockResolvedValueOnce(mockChallenge as Challenge); // findById after save
      challengeRepo.create.mockReturnValue(mockChallenge as Challenge);
      challengeRepo.save.mockResolvedValue(mockChallenge as Challenge);

      const result = await service.create('user-1', dto);

      expect(result.challenge).toBeDefined();
      expect(rewardsService.enqueueReward).toHaveBeenCalledWith({
        memberId: 'user-1',
        actionType: RewardActionType.CHALLENGE_CREATED,
        refId: 'challenge-1',
        refType: 'challenge',
        metadata: { pointApplyable: true },
      });
    });

    it('should pass pointApplyable=false when content is not point-applyable', async () => {
      const nonApplyableContent = { ...mockContent, pointApplyable: false };
      contentRepo.findOne.mockResolvedValue(nonApplyableContent as Content);
      challengeRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockChallenge as Challenge);
      challengeRepo.create.mockReturnValue(mockChallenge as Challenge);
      challengeRepo.save.mockResolvedValue(mockChallenge as Challenge);

      await service.create('user-1', dto);

      expect(rewardsService.enqueueReward).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { pointApplyable: false } }),
      );
    });

    it('should not include pointEarned or xpEarned in response', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
      challengeRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockChallenge as Challenge);
      challengeRepo.create.mockReturnValue(mockChallenge as Challenge);
      challengeRepo.save.mockResolvedValue(mockChallenge as Challenge);

      const result = await service.create('user-1', dto);

      expect((result as any).pointEarned).toBeUndefined();
      expect((result as any).xpEarned).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if challenge not found', async () => {
      challengeRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return challenge if found', async () => {
      challengeRepo.findOne.mockResolvedValue(mockChallenge as Challenge);

      const result = await service.findById('challenge-1');

      expect(result).toEqual(mockChallenge);
    });
  });

  describe('existsByMemberAndContent', () => {
    it('should return true if challenge exists', async () => {
      challengeRepo.existsBy.mockResolvedValue(true);

      const result = await service.existsByMemberAndContent('user-1', 'content-1');

      expect(result).toBe(true);
    });

    it('should return false if challenge does not exist', async () => {
      challengeRepo.existsBy.mockResolvedValue(false);

      const result = await service.existsByMemberAndContent('user-1', 'content-1');

      expect(result).toBe(false);
    });
  });
});
