import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WatchHistory } from "@entities/watch-history.entity";
import { Content } from "@entities/content.entity";
import { CreateWatchHistoryDto } from "./dto/create-watch-history.dto";
import { PaginationQueryDto, PaginationMeta } from "../boards/dto/pagination.dto";
import { ContentType } from "@enums/content.enum";
import { RewardsService } from "../rewards/rewards.service";
import { RewardAction } from "../rewards/constants/reward-events";

@Injectable()
export class WatchHistoryService {
  constructor(
    @InjectRepository(WatchHistory)
    private readonly watchHistoryRepo: Repository<WatchHistory>,
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    private readonly rewardsService: RewardsService,
  ) {}

  async findAll(
    memberId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: WatchHistory[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await this.watchHistoryRepo.findAndCount({
      where: { memberId },
      relations: ["content"],
      order: { lastWatchedAt: "DESC" },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async createOrUpdate(memberId: string, dto: CreateWatchHistoryDto): Promise<WatchHistory> {
    // 콘텐츠 존재 여부 확인
    const content = await this.contentRepo.findOne({ where: { id: dto.contentId } });
    if (!content) {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    // 기존 시청 기록 확인
    const existing = await this.watchHistoryRepo.findOne({
      where: { memberId, contentId: dto.contentId },
    });

    if (existing) {
      const prevWatchRate = existing.watchRate;

      await this.watchHistoryRepo.update(existing.id, {
        totalDuration: dto.totalDuration,
        lastWatchedTimestamp: dto.lastWatchedTimestamp,
        watchRate: dto.watchRate,
        lastWatchedAt: new Date(),
      });

      // 튜토리얼(symbol)을 이번에 처음으로 100% 완료했을 때만 보상 (논리 이벤트: tutorial_watch)
      if (
        content.type === ContentType.SYMBOL &&
        dto.watchRate >= 100 &&
        prevWatchRate < 100
      ) {
        await this.rewardsService.enqueueReward({
          memberId,
          refType: 'tutorial_watch',
          refAction: RewardAction.CREATE,
          refId: existing.id,
          metadata: { contentId: dto.contentId, pointApplyable: content.pointApplyable },
        });
      }

      return this.watchHistoryRepo.findOne({
        where: { id: existing.id },
      }) as Promise<WatchHistory>;
    }

    // 새로 생성
    const watchHistory = this.watchHistoryRepo.create({
      memberId,
      contentId: dto.contentId,
      totalDuration: dto.totalDuration,
      lastWatchedTimestamp: dto.lastWatchedTimestamp,
      watchRate: dto.watchRate,
    });

    const saved = await this.watchHistoryRepo.save(watchHistory);

    // 처음 저장 시 이미 100% 완료이고 튜토리얼(symbol)인 경우 (논리 이벤트: tutorial_watch)
    if (content.type === ContentType.SYMBOL && dto.watchRate >= 100) {
      await this.rewardsService.enqueueReward({
        memberId,
        refType: 'tutorial_watch',
        refAction: RewardAction.CREATE,
        refId: saved.id,
        metadata: { contentId: dto.contentId, pointApplyable: content.pointApplyable },
      });
    }

    return saved;
  }
}
