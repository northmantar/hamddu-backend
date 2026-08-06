import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { Channel } from '@entities/channel.entity';
import { ChannelLink } from '@entities/channel-link.entity';
import { Media } from '@entities/media.entity';
import { ChannelLinkType, ChannelPlatform, ChannelStatus } from '@enums/channel.enum';
import { ChannelDetailDto } from './dto/channel-response.dto';

describe('ChannelsService', () => {
  let service: ChannelsService;
  let channelRepo: jest.Mocked<Repository<Channel>>;
  let channelLinkRepo: jest.Mocked<Repository<ChannelLink>>;
  let mediaRepo: jest.Mocked<Repository<Media>>;

  const mockChannel: Partial<Channel> = {
    id: 'channel-123',
    name: '함뜨 공식채널',
    platform: ChannelPlatform.YOUTUBE,
    sourceChannelId: 'UC_test_channel_id',
    status: ChannelStatus.ACTIVE,
    description: null,
    profileMediaId: null,
    profileMedia: null,
    bannerMediaId: null,
    bannerMedia: null,
    links: [],
    addedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const mockChannelRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockChannelLinkRepo = {
      delete: jest.fn(),
      insert: jest.fn(),
    };

    const mockMediaRepo = {
      countBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: getRepositoryToken(Channel), useValue: mockChannelRepo },
        { provide: getRepositoryToken(ChannelLink), useValue: mockChannelLinkRepo },
        { provide: getRepositoryToken(Media), useValue: mockMediaRepo },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
    channelRepo = module.get(getRepositoryToken(Channel));
    channelLinkRepo = module.get(getRepositoryToken(ChannelLink));
    mediaRepo = module.get(getRepositoryToken(Media));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all channels ordered by addedAt DESC', async () => {
      channelRepo.find.mockResolvedValue([mockChannel as Channel]);

      const result = await service.findAll();

      expect(result).toEqual([mockChannel]);
      expect(channelRepo.find).toHaveBeenCalledWith({ order: { addedAt: 'DESC' } });
    });

    it('should return empty array when no channels exist', async () => {
      channelRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─── findById ───────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return channel if found', async () => {
      channelRepo.findOne.mockResolvedValue(mockChannel as Channel);

      const result = await service.findById('channel-123');

      expect(result).toEqual(mockChannel);
    });

    it('should throw NotFoundException if not found', async () => {
      channelRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      name: '함뜨 공식채널',
      platform: ChannelPlatform.YOUTUBE,
      sourceChannelId: 'UC_test_channel_id',
    };

    it('should create channel successfully', async () => {
      channelRepo.findOne.mockResolvedValue(null);
      channelRepo.create.mockReturnValue(mockChannel as Channel);
      channelRepo.save.mockResolvedValue(mockChannel as Channel);

      const result = await service.create(createDto);

      expect(channelRepo.create).toHaveBeenCalledWith({
        name: createDto.name,
        platform: createDto.platform,
        sourceChannelId: createDto.sourceChannelId,
      });
      expect(channelRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockChannel);
    });

    it('should throw ConflictException if sourceChannelId already exists', async () => {
      channelRepo.findOne.mockResolvedValue(mockChannel as Channel);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(channelRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update name successfully', async () => {
      channelRepo.findOne.mockResolvedValue(mockChannel as Channel);
      channelRepo.update.mockResolvedValue({ affected: 1 } as any);

      await service.update('channel-123', { name: '새 채널명' });

      expect(channelRepo.update).toHaveBeenCalledWith(
        'channel-123',
        expect.objectContaining({ name: '새 채널명' }),
      );
    });

    it('should update status to inactive', async () => {
      channelRepo.findOne.mockResolvedValue(mockChannel as Channel);
      channelRepo.update.mockResolvedValue({ affected: 1 } as any);

      await service.update('channel-123', { status: ChannelStatus.INACTIVE });

      expect(channelRepo.update).toHaveBeenCalledWith(
        'channel-123',
        expect.objectContaining({ status: ChannelStatus.INACTIVE }),
      );
    });

    it('should throw NotFoundException if channel not found', async () => {
      channelRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: '새 채널명' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findHomeById ───────────────────────────────────────────────────────────

  describe('findHomeById', () => {
    it('should load home relations', async () => {
      channelRepo.findOne.mockResolvedValue(mockChannel as Channel);

      await service.findHomeById('channel-123');

      expect(channelRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'channel-123' },
        relations: expect.arrayContaining(['profileMedia', 'bannerMedia', 'links']),
      });
    });

    it('should throw NotFoundException if not found', async () => {
      channelRepo.findOne.mockResolvedValue(null);

      await expect(service.findHomeById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update: 채널 홈 ────────────────────────────────────────────────────────

  describe('update - 채널 홈', () => {
    beforeEach(() => {
      channelRepo.findOne.mockResolvedValue(mockChannel as Channel);
      channelRepo.update.mockResolvedValue({ affected: 1 } as any);
      channelLinkRepo.delete.mockResolvedValue({ affected: 0 } as any);
      channelLinkRepo.insert.mockResolvedValue({} as any);
      mediaRepo.countBy.mockResolvedValue(2);
    });

    it('should update description', async () => {
      await service.update('channel-123', { description: '소개글입니다.' });

      expect(channelRepo.update).toHaveBeenCalledWith(
        'channel-123',
        expect.objectContaining({ description: '소개글입니다.' }),
      );
    });

    it('should clear description when null is provided', async () => {
      await service.update('channel-123', { description: null });

      expect(channelRepo.update).toHaveBeenCalledWith(
        'channel-123',
        expect.objectContaining({ description: null }),
      );
    });

    it('should update profile and banner media ids', async () => {
      await service.update('channel-123', {
        profileMediaId: 'media-1',
        bannerMediaId: 'media-2',
      });

      expect(channelRepo.update).toHaveBeenCalledWith(
        'channel-123',
        expect.objectContaining({ profileMediaId: 'media-1', bannerMediaId: 'media-2' }),
      );
    });

    it('should clear images when null is provided', async () => {
      await service.update('channel-123', { profileMediaId: null, bannerMediaId: null });

      expect(channelRepo.update).toHaveBeenCalledWith(
        'channel-123',
        expect.objectContaining({ profileMediaId: null, bannerMediaId: null }),
      );
      expect(mediaRepo.countBy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for a non-existent media id', async () => {
      mediaRepo.countBy.mockResolvedValue(0);

      await expect(
        service.update('channel-123', { profileMediaId: 'unknown-media' }),
      ).rejects.toThrow(BadRequestException);

      expect(channelRepo.update).not.toHaveBeenCalled();
    });

    it('should NOT touch links when links is omitted', async () => {
      await service.update('channel-123', { name: '새 이름' });

      expect(channelLinkRepo.delete).not.toHaveBeenCalled();
      expect(channelLinkRepo.insert).not.toHaveBeenCalled();
    });

    it('should replace links and assign sortOrder by array order', async () => {
      await service.update('channel-123', {
        links: [
          { type: ChannelLinkType.INSTAGRAM, url: 'https://instagram.com/hamddu' },
          { type: ChannelLinkType.SMARTSTORE, url: 'https://smartstore.naver.com/hamddu' },
        ],
      });

      expect(channelLinkRepo.delete).toHaveBeenCalledWith({ channelId: 'channel-123' });
      expect(channelLinkRepo.insert).toHaveBeenCalledWith([
        {
          channelId: 'channel-123',
          type: ChannelLinkType.INSTAGRAM,
          label: null,
          url: 'https://instagram.com/hamddu',
          sortOrder: 0,
        },
        {
          channelId: 'channel-123',
          type: ChannelLinkType.SMARTSTORE,
          label: null,
          url: 'https://smartstore.naver.com/hamddu',
          sortOrder: 1,
        },
      ]);
    });

    it('should delete all links when an empty array is provided', async () => {
      await service.update('channel-123', { links: [] });

      expect(channelLinkRepo.delete).toHaveBeenCalledWith({ channelId: 'channel-123' });
      expect(channelLinkRepo.insert).not.toHaveBeenCalled();
    });

    it('should keep the label for an etc link', async () => {
      await service.update('channel-123', {
        links: [{ type: ChannelLinkType.ETC, url: 'https://blog.naver.com/hamddu', label: '블로그' }],
      });

      expect(channelLinkRepo.insert).toHaveBeenCalledWith([
        expect.objectContaining({ type: ChannelLinkType.ETC, label: '블로그' }),
      ]);
    });

    it('should throw BadRequestException when an etc link has no label', async () => {
      await expect(
        service.update('channel-123', {
          links: [{ type: ChannelLinkType.ETC, url: 'https://blog.naver.com/hamddu' }],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(channelLinkRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when an etc link label is only whitespace', async () => {
      await expect(
        service.update('channel-123', {
          links: [{ type: ChannelLinkType.ETC, url: 'https://blog.naver.com/hamddu', label: '   ' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete channel successfully', async () => {
      channelRepo.findOne.mockResolvedValue(mockChannel as Channel);
      channelRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.delete('channel-123');

      expect(channelRepo.delete).toHaveBeenCalledWith('channel-123');
    });

    it('should throw NotFoundException if channel not found', async () => {
      channelRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
      expect(channelRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ─── ChannelDetailDto.fromWithHome ──────────────────────────────────────────

  describe('ChannelDetailDto.fromWithHome', () => {
    it('should map images and sort links by sortOrder', () => {
      const channel = {
        ...mockChannel,
        description: '소개글',
        profileMediaId: 'media-1',
        profileMedia: { url: 'https://cdn.hamddu.online/media/profile.png' },
        bannerMediaId: 'media-2',
        bannerMedia: { url: 'https://cdn.hamddu.online/media/banner.png' },
        links: [
          { id: 'l2', type: ChannelLinkType.SMARTSTORE, label: null, url: 'https://b', sortOrder: 1 },
          { id: 'l1', type: ChannelLinkType.INSTAGRAM, label: null, url: 'https://a', sortOrder: 0 },
        ],
      } as Channel;

      const dto = ChannelDetailDto.fromWithHome(channel);

      expect(dto.description).toBe('소개글');
      expect(dto.profileImageUrl).toBe('https://cdn.hamddu.online/media/profile.png');
      expect(dto.bannerImageUrl).toBe('https://cdn.hamddu.online/media/banner.png');
      expect(dto.links.map((l) => l.id)).toEqual(['l1', 'l2']);
    });

    it('should map images to null and links to empty array when unset', () => {
      const dto = ChannelDetailDto.fromWithHome(mockChannel as Channel);

      expect(dto.profileImageUrl).toBeNull();
      expect(dto.bannerImageUrl).toBeNull();
      expect(dto.links).toEqual([]);
    });

    it('should tolerate links being undefined (관계 미로드)', () => {
      const channel = { ...mockChannel, links: undefined } as unknown as Channel;

      const dto = ChannelDetailDto.fromWithHome(channel);

      expect(dto.links).toEqual([]);
    });
  });
});
