import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistory } from '@entities/watch-history.entity';
import { Content } from '@entities/content.entity';
import { RewardsService } from '../rewards/rewards.service';
import { RewardActionType } from '../rewards/constants/reward.constants';

describe('WatchHistoryService', () => {
  let service: WatchHistoryService;
  let watchHistoryRepo: jest.Mocked<Repository<WatchHistory>>;
  let contentRepo: jest.Mocked<Repository<Content>>;
  let rewardsService: jest.Mocked<RewardsService>;

  const mockContent: Partial<Content> = {
    id: 'content-1',
    name: '겉뜨기',
    pointApplyable: true,
  };

  const existingHistory: Partial<WatchHistory> = {
    id: 'wh-1',
    memberId: 'user-1',
    contentId: 'content-1',
    watchRate: 50,
    totalDuration: 300,
  };

  const dto = {
    contentId: 'content-1',
    totalDuration: 600,
    lastWatchedTimestamp: '00:10:00',
    watchRate: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchHistoryService,
        {
          provide: getRepositoryToken(WatchHistory),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
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

    service            = module.get(WatchHistoryService);
    watchHistoryRepo   = module.get(getRepositoryToken(WatchHistory));
    contentRepo        = module.get(getRepositoryToken(Content));
    rewardsService     = module.get(RewardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdate', () => {
    it('should throw NotFoundException if content not found', async () => {
      contentRepo.findOne.mockResolvedValue(null);

      await expect(service.createOrUpdate('user-1', dto)).rejects.toThrow(NotFoundException);
    });

    describe('update existing record', () => {
      it('should enqueue reward when watchRate goes from <100 to >=100', async () => {
        contentRepo.findOne.mockResolvedValue(mockContent as Content);
        watchHistoryRepo.findOne
          .mockResolvedValueOnce(existingHistory as WatchHistory) // existing (watchRate=50)
          .mockResolvedValueOnce({ ...existingHistory, watchRate: 100 } as WatchHistory); // after update
        watchHistoryRepo.update.mockResolvedValue(undefined as any);

        await service.createOrUpdate('user-1', dto);

        expect(rewardsService.enqueueReward).toHaveBeenCalledWith({
          memberId: 'user-1',
          actionType: RewardActionType.VIDEO_WATCHED,
          refId: 'wh-1',
          refType: 'watch_history',
          metadata: { contentId: 'content-1', pointApplyable: true },
        });
      });

      it('should NOT enqueue reward when watchRate was already 100', async () => {
        const alreadyComplete = { ...existingHistory, watchRate: 100 };
        contentRepo.findOne.mockResolvedValue(mockContent as Content);
        watchHistoryRepo.findOne
          .mockResolvedValueOnce(alreadyComplete as WatchHistory)
          .mockResolvedValueOnce(alreadyComplete as WatchHistory);
        watchHistoryRepo.update.mockResolvedValue(undefined as any);

        await service.createOrUpdate('user-1', dto);

        expect(rewardsService.enqueueReward).not.toHaveBeenCalled();
      });

      it('should NOT enqueue reward when new watchRate is still <100', async () => {
        contentRepo.findOne.mockResolvedValue(mockContent as Content);
        watchHistoryRepo.findOne
          .mockResolvedValueOnce(existingHistory as WatchHistory)  // watchRate=50
          .mockResolvedValueOnce({ ...existingHistory, watchRate: 80 } as WatchHistory);
        watchHistoryRepo.update.mockResolvedValue(undefined as any);

        await service.createOrUpdate('user-1', { ...dto, watchRate: 80 });

        expect(rewardsService.enqueueReward).not.toHaveBeenCalled();
      });
    });

    describe('create new record', () => {
      it('should enqueue reward when new record is created with watchRate=100', async () => {
        const savedHistory = { ...existingHistory, id: 'wh-new', watchRate: 100 };
        contentRepo.findOne.mockResolvedValue(mockContent as Content);
        watchHistoryRepo.findOne.mockResolvedValueOnce(null); // no existing
        watchHistoryRepo.create.mockReturnValue(savedHistory as WatchHistory);
        watchHistoryRepo.save.mockResolvedValue(savedHistory as WatchHistory);

        await service.createOrUpdate('user-1', dto);

        expect(rewardsService.enqueueReward).toHaveBeenCalledWith({
          memberId: 'user-1',
          actionType: RewardActionType.VIDEO_WATCHED,
          refId: 'wh-new',
          refType: 'watch_history',
          metadata: { contentId: 'content-1', pointApplyable: true },
        });
      });

      it('should NOT enqueue reward when new record has watchRate<100', async () => {
        const savedHistory = { ...existingHistory, id: 'wh-new', watchRate: 60 };
        contentRepo.findOne.mockResolvedValue(mockContent as Content);
        watchHistoryRepo.findOne.mockResolvedValueOnce(null);
        watchHistoryRepo.create.mockReturnValue(savedHistory as WatchHistory);
        watchHistoryRepo.save.mockResolvedValue(savedHistory as WatchHistory);

        await service.createOrUpdate('user-1', { ...dto, watchRate: 60 });

        expect(rewardsService.enqueueReward).not.toHaveBeenCalled();
      });
    });
  });
});
