import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ContentsService } from './contents.service';
import { Content } from '@entities/content.entity';
import { Channel } from '@entities/channel.entity';
import { WatchHistory } from '@entities/watch-history.entity';
import { Challenge } from '@entities/challenge.entity';
import { User } from '@entities/user.entity';
import { ContentType, ContentStatus } from '@enums/content.enum';
import { ChannelStatus, ChannelPlatform } from '@enums/channel.enum';
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
    platform: ChannelPlatform.YOUTUBE,
    status: ChannelStatus.ACTIVE,
  };

  const mockContent: Partial<Content> = {
    id: 'content-1',
    name: '사슬뜨기',
    type: ContentType.SYMBOL,
    status: ContentStatus.ACTIVE,
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
  let mockEntityManager: Record<string, jest.Mock>;
  let mockDataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockContent], 1]),
      getMany: jest.fn().mockResolvedValue([mockContent]),
    };

    mockEntityManager = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockDataSource = {
      transaction: jest.fn((fn) => fn(mockEntityManager)),
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
        { provide: DataSource, useValue: mockDataSource },
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

    it('should filter by active content status', async () => {
      await service.findAll({ page: 1, limit: 20 });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'content.status = :contentStatus',
        { contentStatus: ContentStatus.ACTIVE },
      );
    });

    it('should filter by active channel status', async () => {
      await service.findAll({ page: 1, limit: 20 });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(channel.id IS NULL OR channel.status = :activeStatus)',
        { activeStatus: ChannelStatus.ACTIVE },
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

  // ─── findActiveContent ────────────────────────────────────────────────────

  describe('findActiveContent', () => {
    it('should return active content with active channel', async () => {
      contentRepo.findOne.mockResolvedValue(mockContent as Content);

      const result = await service.findActiveContent('content-1');

      expect(result).toEqual(mockContent);
    });

    it('should throw NotFoundException for inactive content', async () => {
      const inactiveContent = { ...mockContent, status: ContentStatus.INACTIVE };
      contentRepo.findOne.mockResolvedValue(inactiveContent as Content);

      await expect(service.findActiveContent('content-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when channel is inactive', async () => {
      const inactiveChannelContent = {
        ...mockContent,
        channel: { ...mockChannel, status: ChannelStatus.INACTIVE },
      };
      contentRepo.findOne.mockResolvedValue(inactiveChannelContent as Content);

      await expect(service.findActiveContent('content-1')).rejects.toThrow(NotFoundException);
    });

    it('should return content with no channel regardless of channel status', async () => {
      const noChannelContent = { ...mockContent, channel: null, channelId: null };
      contentRepo.findOne.mockResolvedValue(noChannelContent as Content);

      const result = await service.findActiveContent('content-1');

      expect(result).toEqual(noChannelContent);
    });

    it('should throw NotFoundException if content does not exist', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.findActiveContent('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findTutorials ────────────────────────────────────────────────────────

  describe('findTutorials', () => {
    it('should join channel and media relations', async () => {
      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('content.channel', 'channel');
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('content.media', 'media');
    });

    it('should filter by SYMBOL type', async () => {
      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(mockQb.where).toHaveBeenCalledWith('content.type = :type', { type: ContentType.SYMBOL });
    });

    it('should filter by active content status', async () => {
      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'content.status = :contentStatus',
        { contentStatus: ContentStatus.ACTIVE },
      );
    });

    it('should filter by active channel status', async () => {
      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(channel.id IS NULL OR channel.status = :activeStatus)',
        { activeStatus: ChannelStatus.ACTIVE },
      );
    });

    it('should apply interests filter when provided', async () => {
      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'content.interests = :interests',
        { interests: UserInterests.CROCHET },
      );
    });

    it('should order by sortOrder ASC', async () => {
      await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(mockQb.orderBy).toHaveBeenCalledWith('content.sortOrder', 'ASC');
    });

    it('should return tutorial contents', async () => {
      const result = await service.findTutorials({ interests: UserInterests.CROCHET });

      expect(result).toEqual([mockContent]);
      expect(mockQb.getMany).toHaveBeenCalled();
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const baseDto = {
      channelId: 'channel-1',
      sourceVideoId: 'abc123',
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
          sourceVideoId: 'abc123',
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

  // ─── delete (renormalize 포함) ────────────────────────────────────────────

  describe('delete', () => {
    beforeEach(() => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
    });

    it('should delete symbol content and call renormalize when interests is set', async () => {
      const symbolContent = { ...mockContent, type: ContentType.SYMBOL, interests: UserInterests.CROCHET };
      contentRepo.findOne.mockResolvedValue(symbolContent as Content);
      contentRepo.delete.mockResolvedValue({ affected: 1 } as any);
      mockEntityManager.find.mockResolvedValue([
        { id: 'id-2', sortOrder: 2 },
        { id: 'id-3', sortOrder: 3 },
      ]);

      await service.delete('content-1', 'admin-1');

      expect(contentRepo.delete).toHaveBeenCalledWith('content-1');
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.update).toHaveBeenCalledWith(Content, 'id-2', { sortOrder: 1 });
      expect(mockEntityManager.update).toHaveBeenCalledWith(Content, 'id-3', { sortOrder: 2 });
    });

    it('should renormalize with null sortOrder items placed last', async () => {
      const symbolContent = { ...mockContent, type: ContentType.SYMBOL, interests: UserInterests.CROCHET };
      contentRepo.findOne.mockResolvedValue(symbolContent as Content);
      contentRepo.delete.mockResolvedValue({ affected: 1 } as any);
      mockEntityManager.find.mockResolvedValue([
        { id: 'id-2', sortOrder: null },
        { id: 'id-3', sortOrder: 2 },
      ]);

      await service.delete('content-1', 'admin-1');

      // sortOrder가 있는 id-3이 1번, null인 id-2가 2번
      expect(mockEntityManager.update).toHaveBeenNthCalledWith(1, Content, 'id-3', { sortOrder: 1 });
      expect(mockEntityManager.update).toHaveBeenNthCalledWith(2, Content, 'id-2', { sortOrder: 2 });
    });

    it('should delete symbol content without renormalize when interests is null', async () => {
      const noInterestsContent = { ...mockContent, type: ContentType.SYMBOL, interests: null };
      contentRepo.findOne.mockResolvedValue(noInterestsContent as Content);
      contentRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.delete('content-1', 'admin-1');

      expect(contentRepo.delete).toHaveBeenCalledWith('content-1');
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should delete free type content without renormalize', async () => {
      const freeContent = { ...mockContent, type: ContentType.FREE, interests: UserInterests.CROCHET };
      contentRepo.findOne.mockResolvedValue(freeContent as Content);
      contentRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.delete('content-1', 'admin-1');

      expect(contentRepo.delete).toHaveBeenCalledWith('content-1');
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-admin', async () => {
      userRepo.findOne.mockResolvedValue(mockMember as User);

      await expect(service.delete('content-1', 'member-1')).rejects.toThrow(ForbiddenException);
      expect(contentRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent content', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent', 'admin-1')).rejects.toThrow(NotFoundException);
      expect(contentRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ─── reorderTutorials ────────────────────────────────────────────────────

  describe('reorderTutorials', () => {
    const crochetIds = ['id-1', 'id-2', 'id-3'];
    const existingContents = [{ id: 'id-1' }, { id: 'id-2' }, { id: 'id-3' }];

    beforeEach(() => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      contentRepo.find.mockResolvedValue(existingContents as Content[]);
    });

    it('should reorder tutorials successfully', async () => {
      await service.reorderTutorials('admin-1', UserInterests.CROCHET, { contentIds: crochetIds });

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.update).toHaveBeenCalledTimes(3);
      expect(mockEntityManager.update).toHaveBeenNthCalledWith(1, Content, 'id-1', { sortOrder: 1 });
      expect(mockEntityManager.update).toHaveBeenNthCalledWith(2, Content, 'id-2', { sortOrder: 2 });
      expect(mockEntityManager.update).toHaveBeenNthCalledWith(3, Content, 'id-3', { sortOrder: 3 });
    });

    it('should throw ForbiddenException for non-admin', async () => {
      userRepo.findOne.mockResolvedValue(mockMember as User);

      await expect(
        service.reorderTutorials('member-1', UserInterests.CROCHET, { contentIds: crochetIds }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for duplicate contentIds', async () => {
      await expect(
        service.reorderTutorials('admin-1', UserInterests.CROCHET, { contentIds: ['id-1', 'id-1', 'id-2'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when count does not match', async () => {
      await expect(
        service.reorderTutorials('admin-1', UserInterests.CROCHET, { contentIds: ['id-1', 'id-2'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid content ID', async () => {
      await expect(
        service.reorderTutorials('admin-1', UserInterests.CROCHET, { contentIds: ['id-1', 'id-2', 'unknown-id'] }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
