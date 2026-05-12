import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WatchHistory } from "@entities/watch-history.entity";
import { Content } from "@entities/content.entity";
import { CreateWatchHistoryDto } from "./dto/create-watch-history.dto";
import { PaginationQueryDto, PaginationMeta } from "../boards/dto/pagination.dto";

@Injectable()
export class WatchHistoryService {
  constructor(
    @InjectRepository(WatchHistory)
    private readonly watchHistoryRepo: Repository<WatchHistory>,
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
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
      // 업데이트
      await this.watchHistoryRepo.update(existing.id, {
        totalDuration: dto.totalDuration,
        lastWatchedTimestamp: dto.lastWatchedTimestamp,
        watchRate: dto.watchRate,
        lastWatchedAt: new Date(),
      });

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

    return this.watchHistoryRepo.save(watchHistory);
  }
}
