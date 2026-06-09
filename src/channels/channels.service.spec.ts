import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { Channel } from '@entities/channel.entity';
import { ChannelPlatform, ChannelStatus } from '@enums/channel.enum';

describe('ChannelsService', () => {
  let service: ChannelsService;
  let channelRepo: jest.Mocked<Repository<Channel>>;

  const mockChannel: Partial<Channel> = {
    id: 'channel-123',
    name: '함뜨 공식채널',
    platform: ChannelPlatform.YOUTUBE,
    sourceChannelId: 'UC_test_channel_id',
    status: ChannelStatus.ACTIVE,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: getRepositoryToken(Channel), useValue: mockChannelRepo },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
    channelRepo = module.get(getRepositoryToken(Channel));
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
});
