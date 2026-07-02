import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { Challenge } from '@entities/challenge.entity';
import { Content } from '@entities/content.entity';
import { Media } from '@entities/media.entity';
import { RewardsService } from '../rewards/rewards.service';
import { RewardAction } from '../rewards/constants/reward-events';

describe('ChallengesService', () => {
  let service: ChallengesService;
  let challengeRepo: jest.Mocked<Repository<Challenge>>;
  let contentRepo: jest.Mocked<Repository<Content>>;
  let rewardsService: jest.Mocked<RewardsService>;

  const mockMedia: Partial<Media> = {
    id: 'media-1',
    url: 'https://cdn.hamddu.online/media/test.jpg',
    mimeType: 'image/jpeg',
  };

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
    mediaId: null,
    media: null,
  };

  const mockChallengeWithMedia: Partial<Challenge> = {
    ...mockChallenge,
    mediaId: 'media-1',
    media: mockMedia as Media,
  };

  let mockQb: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockChallenge], 1]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        {
          provide: getRepositoryToken(Challenge),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQb),
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

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should join media relation in query builder', async () => {
      await service.findAll({ page: 1, limit: 20 });

      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('challenge.media', 'media');
    });

    it('should join content and member relations', async () => {
      await service.findAll({ page: 1, limit: 20 });

      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('challenge.content', 'content');
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('challenge.member', 'member');
    });

    it('should apply contentId filter when provided', async () => {
      await service.findAll({ page: 1, limit: 20, contentId: 'content-1' });

      expect(mockQb.where).toHaveBeenCalledWith(
        'challenge.contentId = :contentId',
        { contentId: 'content-1' },
      );
    });

    it('should return paginated result with meta', async () => {
      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.meta).toEqual({
        page: 2,
        limit: 5,
        totalCount: 1,
        totalPages: 1,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should query with media relation', async () => {
      challengeRepo.findOne.mockResolvedValue(mockChallenge as Challenge);

      await service.findById('challenge-1');

      expect(challengeRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ relations: expect.arrayContaining(['media']) }),
      );
    });

    it('should query with content and member relations', async () => {
      challengeRepo.findOne.mockResolvedValue(mockChallenge as Challenge);

      await service.findById('challenge-1');

      expect(challengeRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['content', 'member']),
        }),
      );
    });

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

  // ─── findMyList ───────────────────────────────────────────────────────────

  describe('findMyList', () => {
    it('should query with media relation', async () => {
      challengeRepo.findAndCount.mockResolvedValue([[mockChallenge as Challenge], 1]);

      await service.findMyList('user-1', { page: 1, limit: 10 });

      expect(challengeRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['media']),
        }),
      );
    });

    it('should filter by memberId', async () => {
      challengeRepo.findAndCount.mockResolvedValue([[mockChallenge as Challenge], 1]);

      await service.findMyList('user-1', { page: 1, limit: 10 });

      expect(challengeRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { memberId: 'user-1' } }),
      );
    });

    it('should return paginated result', async () => {
      challengeRepo.findAndCount.mockResolvedValue([[mockChallenge as Challenge], 3]);

      const result = await service.findMyList('user-1', { page: 1, limit: 10 });

      expect(result.meta.totalCount).toBe(3);
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { contentId: 'content-1', title: '첫 챌린지', body: '완료!' };
    const dtoWithMedia = { ...dto, mediaId: 'media-1' };

    it('should throw NotFoundException if content not found', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.create('user-1', dto)).rejects.toThrow(NotFoundException);
      expect(rewardsService.enqueueReward).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if challenge already exists for this content', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
      challengeRepo.findOne.mockResolvedValueOnce(mockChallenge as Challenge);

      await expect(service.create('user-1', dto)).rejects.toThrow(ConflictException);
      expect(rewardsService.enqueueReward).not.toHaveBeenCalled();
    });

    it('should pass mediaId from dto to challengeRepo.create', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
      challengeRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockChallengeWithMedia as Challenge);
      challengeRepo.create.mockReturnValue(mockChallengeWithMedia as Challenge);
      challengeRepo.save.mockResolvedValue(mockChallengeWithMedia as Challenge);

      await service.create('user-1', dtoWithMedia);

      expect(challengeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mediaId: 'media-1' }),
      );
    });

    it('should set mediaId to null when not provided in dto', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
      challengeRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockChallenge as Challenge);
      challengeRepo.create.mockReturnValue(mockChallenge as Challenge);
      challengeRepo.save.mockResolvedValue(mockChallenge as Challenge);

      await service.create('user-1', dto);

      expect(challengeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mediaId: null }),
      );
    });

    it('should create challenge and enqueue reward', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
      challengeRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockChallenge as Challenge);
      challengeRepo.create.mockReturnValue(mockChallenge as Challenge);
      challengeRepo.save.mockResolvedValue(mockChallenge as Challenge);

      const result = await service.create('user-1', dto);

      expect(result.challenge).toBeDefined();
      expect(rewardsService.enqueueReward).toHaveBeenCalledWith({
        memberId: 'user-1',
        refType: 'challenge',
        refAction: RewardAction.CREATE,
        refId: 'challenge-1',
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
  });

  // ─── existsByMemberAndContent ─────────────────────────────────────────────

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
