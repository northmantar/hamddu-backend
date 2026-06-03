import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { Content } from '@entities/content.entity';
import { Channel } from '@entities/channel.entity';
import { WatchHistory } from '@entities/watch-history.entity';
import { Challenge } from '@entities/challenge.entity';
import { User } from '@entities/user.entity';
import { ContentType } from '@enums/content.enum';
import { UserInterests, UserType } from '@enums/user.enum';

describe('ContentsService', () => {
  let service: ContentsService;
  let contentRepo: jest.Mocked<Repository<Content>>;
  let channelRepo: jest.Mocked<Repository<Channel>>;
  let watchHistoryRepo: jest.Mocked<Repository<WatchHistory>>;
  let challengeRepo: jest.Mocked<Repository<Challenge>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockChannel: Partial<Channel> = {
    id: 'channel-1',
    name: '함뜨 공식',
  };

  const mockContent: Partial<Content> = {
    id: 'content-1',
    name: '사슬뜨기',
    type: ContentType.SYMBOL,
    interests: UserInterests.CROCHET,
    channelId: 'channel-1',
    channel: mockChannel as Channel,
    mediaId: null,
    media: null,
    pointApplyable: true,
    sortOrder: 1,
    uploadedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockAdmin: Partial<User> = {
    id: 'admin-1',
    type: UserType.ADMIN,
  };

  const mockMember: Partial<User> = {
    id: 'member-1',
    type: UserType.MEMBER,
  };

  let mockQb: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockContent], 1]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentsService,
        {
          provide: getRepositoryToken(Content),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQb),
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Channel),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(WatchHistory),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Challenge),
          useValue: { existsBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service          = module.get(ContentsService);
    contentRepo      = module.get(getRepositoryToken(Content));
    channelRepo      = module.get(getRepositoryToken(Channel));
    watchHistoryRepo = module.get(getRepositoryToken(WatchHistory));
    challengeRepo    = module.get(getRepositoryToken(Challenge));
    userRepo         = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should join media relation in query builder', async () => {
      await service.findAll({ page: 1, limit: 20 });

      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('content.media', 'media');
    });

    it('should join channel relation in query builder', async () => {
      await service.findAll({ page: 1, limit: 20 });

      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('content.channel', 'channel');
    });

    it('should apply type filter when provided', async () => {
      await service.findAll({ page: 1, limit: 20, type: ContentType.SYMBOL });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'content.type = :type',
        { type: ContentType.SYMBOL },
      );
    });

    it('should apply channelId filter when provided', async () => {
      await service.findAll({ page: 1, limit: 20, channelId: 'channel-1' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'content.channelId = :channelId',
        { channelId: 'channel-1' },
      );
    });

    it('should return paginated result with correct meta', async () => {
      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.meta).toEqual({
        page: 2,
        limit: 5,
        totalCount: 1,
        totalPages: 1,
      });
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should query with media relation', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);

      await service.findById('content-1');

      expect(contentRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['media']),
        }),
      );
    });

    it('should query with channel relation', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);

      await service.findById('content-1');

      expect(contentRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['channel']),
        }),
      );
    });

    it('should throw NotFoundException when content not found', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return content when found', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);

      const result = await service.findById('content-1');

      expect(result).toEqual(mockContent);
    });
  });

  // ─── findTutorials ────────────────────────────────────────────────────────

  describe('findTutorials', () => {
    it('should query with media relation', async () => {
      contentRepo.find.mockResolvedValue([mockContent as Content]);

      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(contentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['media']),
        }),
      );
    });

    it('should query with channel relation', async () => {
      contentRepo.find.mockResolvedValue([mockContent as Content]);

      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(contentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['channel']),
        }),
      );
    });

    it('should filter by SYMBOL type and interests', async () => {
      contentRepo.find.mockResolvedValue([mockContent as Content]);

      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(contentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: ContentType.SYMBOL,
            interests: UserInterests.CROCHET,
          },
        }),
      );
    });

    it('should order by sortOrder ASC', async () => {
      contentRepo.find.mockResolvedValue([mockContent as Content]);

      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(contentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { sortOrder: 'ASC' } }),
      );
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const baseDto = {
      channelId: 'channel-1',
      youtubeVideoId: 'abc123',
      name: '사슬뜨기',
      type: ContentType.SYMBOL,
    };

    beforeEach(() => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      channelRepo.findOne.mockResolvedValue(mockChannel as Channel);
      contentRepo.create.mockReturnValue(mockContent as Content);
      contentRepo.save.mockResolvedValue(mockContent as Content);
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      userRepo.findOne.mockResolvedValue(mockMember as User);

      await expect(service.create('member-1', baseDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid channel', async () => {
      channelRepo.findOne.mockResolvedValue(null);

      await expect(service.create('admin-1', baseDto)).rejects.toThrow(BadRequestException);
    });

    it('should pass mediaId to contentRepo.create when provided', async () => {
      const dtoWithMedia = { ...baseDto, mediaId: 'media-1' };

      await service.create('admin-1', dtoWithMedia);

      expect(contentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mediaId: 'media-1' }),
      );
    });

    it('should set mediaId to null when not provided', async () => {
      await service.create('admin-1', baseDto);

      expect(contentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mediaId: null }),
      );
    });

    it('should create content with correct fields', async () => {
      await service.create('admin-1', { ...baseDto, interests: UserInterests.CROCHET, sortOrder: 2 });

      expect(contentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channelId: 'channel-1',
          youtubeVideoId: 'abc123',
          name: '사슬뜨기',
          type: ContentType.SYMBOL,
          interests: UserInterests.CROCHET,
          sortOrder: 2,
        }),
      );
    });

    it('should return saved content after create', async () => {
      const result = await service.create('admin-1', baseDto);

      expect(result).toEqual(mockContent);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    beforeEach(() => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      contentRepo.findOne.mockResolvedValue(mockContent as Content);
      contentRepo.update.mockResolvedValue(undefined as any);
    });

    it('should throw ForbiddenException for non-admin user', async () => {
      userRepo.findOne.mockResolvedValue(mockMember as User);

      await expect(service.update('content-1', 'member-1', {})).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent content', async () => {
      contentRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.update('non-existent', 'admin-1', {})).rejects.toThrow(NotFoundException);
    });

    it('should include mediaId in update when provided', async () => {
      await service.update('content-1', 'admin-1', { mediaId: 'media-2' });

      expect(contentRepo.update).toHaveBeenCalledWith(
        'content-1',
        expect.objectContaining({ mediaId: 'media-2' }),
      );
    });

    it('should NOT include mediaId in update when not provided', async () => {
      await service.update('content-1', 'admin-1', { name: '새 이름' });

      const updateArg = (contentRepo.update.mock.calls[0] as any)[1];
      expect(updateArg).not.toHaveProperty('mediaId');
    });

    it('should update name when provided', async () => {
      await service.update('content-1', 'admin-1', { name: '겉뜨기' });

      expect(contentRepo.update).toHaveBeenCalledWith(
        'content-1',
        expect.objectContaining({ name: '겉뜨기' }),
      );
    });

    it('should update pointApplyable when provided', async () => {
      await service.update('content-1', 'admin-1', { pointApplyable: false });

      expect(contentRepo.update).toHaveBeenCalledWith(
        'content-1',
        expect.objectContaining({ pointApplyable: false }),
      );
    });

    it('should return updated content', async () => {
      const result = await service.update('content-1', 'admin-1', { name: '겉뜨기' });

      expect(result).toEqual(mockContent);
    });
  });
});
