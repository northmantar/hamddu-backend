import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Content } from "@entities/content.entity";
import { Channel } from "@entities/channel.entity";
import { WatchHistory } from "@entities/watch-history.entity";
import { Challenge } from "@entities/challenge.entity";
import { User } from "@entities/user.entity";
import { ContentType, ContentStatus } from "@enums/content.enum";
import { ChannelStatus } from "@enums/channel.enum";
import { UserType } from "@enums/user.enum";
import { ContentQueryDto } from "./dto/content-query.dto";
import { CreateContentDto } from "./dto/create-content.dto";
import { UpdateContentDto } from "./dto/update-content.dto";
import { TutorialQueryDto } from "./dto/tutorial-query.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { BulkReorderDto } from "./dto/bulk-reorder.dto";
import { PaginationMeta } from "../boards/dto/pagination.dto";
import { UserInterests } from "@enums/user.enum";

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
    @InjectRepository(WatchHistory)
    private readonly watchHistoryRepo: Repository<WatchHistory>,
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  private async checkAdmin(memberId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: memberId } });
    if (user?.type !== UserType.ADMIN) {
      throw new ForbiddenException("접근 권한이 없습니다.");
    }
  }

  async findAll(
    query: ContentQueryDto,
  ): Promise<{ data: Content[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, type, channelId } = query;
    const skip = (page - 1) * limit;

    const qb = this.contentRepo
      .createQueryBuilder("content")
      .leftJoinAndSelect("content.channel", "channel")
      .leftJoinAndSelect("content.media", "media")
      .andWhere("content.status = :contentStatus", { contentStatus: ContentStatus.ACTIVE })
      .andWhere("(channel.id IS NULL OR channel.status = :activeStatus)", { activeStatus: ChannelStatus.ACTIVE })
      .orderBy("content.createdAt", "DESC");

    if (type) {
      qb.andWhere("content.type = :type", { type });
    }

    if (channelId) {
      qb.andWhere("content.channelId = :channelId", { channelId });
    }

    const [data, totalCount] = await qb.skip(skip).take(limit).getManyAndCount();

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

  async findById(id: string): Promise<Content> {
    const content = await this.contentRepo.findOne({
      where: { id },
      relations: ["channel", "media"],
    });

    if (!content) {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    return content;
  }

  async findActiveContent(id: string): Promise<Content> {
    const content = await this.findById(id);

    if (content.status !== ContentStatus.ACTIVE) {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    if (content.channel && content.channel.status !== ChannelStatus.ACTIVE) {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    return content;
  }

  async findWatchHistory(contentId: string, memberId: string): Promise<WatchHistory | null> {
    return this.watchHistoryRepo.findOne({
      where: { contentId, memberId },
    });
  }

  async isChallengeCompleted(contentId: string, memberId: string): Promise<boolean> {
    return this.challengeRepo.existsBy({ contentId, memberId });
  }

  async findTutorials(query: TutorialQueryDto): Promise<Content[]> {
    const qb = this.contentRepo
      .createQueryBuilder("content")
      .leftJoinAndSelect("content.channel", "channel")
      .leftJoinAndSelect("content.media", "media")
      .where("content.type = :type", { type: ContentType.SYMBOL })
      .andWhere("content.status = :contentStatus", { contentStatus: ContentStatus.ACTIVE })
      .andWhere("(channel.id IS NULL OR channel.status = :activeStatus)", { activeStatus: ChannelStatus.ACTIVE })
      .orderBy("content.sortOrder", "ASC");

    if (query.interests) {
      qb.andWhere("content.interests = :interests", { interests: query.interests });
    }

    return qb.getMany();
  }

  async create(memberId: string, dto: CreateContentDto): Promise<Content> {
    await this.checkAdmin(memberId);

    const channel = await this.channelRepo.findOne({ where: { id: dto.channelId } });
    if (!channel) {
      throw new BadRequestException("유효하지 않은 채널입니다.");
    }

    const content = this.contentRepo.create({
      channelId: dto.channelId,
      sourceVideoId: dto.sourceVideoId,
      name: dto.name,
      type: dto.type,
      interests: dto.interests ?? null,
      sortOrder: dto.sortOrder ?? null,
      pointApplyable: dto.pointApplyable ?? false,
      mediaId: dto.mediaId ?? null,
    });

    const saved = await this.contentRepo.save(content);
    return this.findById(saved.id);
  }

  async update(contentId: string, memberId: string, dto: UpdateContentDto): Promise<Content> {
    await this.checkAdmin(memberId);

    await this.findById(contentId);

    await this.contentRepo.update(contentId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.sourceVideoId !== undefined && { sourceVideoId: dto.sourceVideoId }),
      ...(dto.channelId !== undefined && { channelId: dto.channelId }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.pointApplyable !== undefined && { pointApplyable: dto.pointApplyable }),
      ...(dto.mediaId !== undefined && { mediaId: dto.mediaId }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    return this.findById(contentId);
  }

  async updateSortOrder(
    contentId: string,
    memberId: string,
    dto: UpdateOrderDto,
  ): Promise<Content> {
    await this.checkAdmin(memberId);

    const content = await this.findById(contentId);

    if (!content.interests) {
      throw new BadRequestException("interests가 지정되지 않은 콘텐츠는 순서를 변경할 수 없습니다.");
    }

    const currentOrder = content.sortOrder;
    const newOrder = dto.sortOrder;

    if (currentOrder === newOrder) {
      return content;
    }

    // 같은 interests 내 콘텐츠들의 순서 재조정
    if (currentOrder === null) {
      // 기존에 순서가 없던 콘텐츠에 순서 부여
      await this.contentRepo
        .createQueryBuilder()
        .update(Content)
        .set({ sortOrder: () => "sort_order + 1" })
        .where("interests = :interests", { interests: content.interests })
        .andWhere("sort_order >= :newOrder", { newOrder })
        .execute();
    } else if (newOrder < currentOrder) {
      // 앞으로 이동: newOrder ~ currentOrder-1 사이의 항목들을 +1
      await this.contentRepo
        .createQueryBuilder()
        .update(Content)
        .set({ sortOrder: () => "sort_order + 1" })
        .where("interests = :interests", { interests: content.interests })
        .andWhere("sort_order >= :newOrder", { newOrder })
        .andWhere("sort_order < :currentOrder", { currentOrder })
        .execute();
    } else {
      // 뒤로 이동: currentOrder+1 ~ newOrder 사이의 항목들을 -1
      await this.contentRepo
        .createQueryBuilder()
        .update(Content)
        .set({ sortOrder: () => "sort_order - 1" })
        .where("interests = :interests", { interests: content.interests })
        .andWhere("sort_order > :currentOrder", { currentOrder })
        .andWhere("sort_order <= :newOrder", { newOrder })
        .execute();
    }

    await this.contentRepo.update(contentId, { sortOrder: newOrder });

    return this.findById(contentId);
  }

  async delete(contentId: string, memberId: string): Promise<void> {
    await this.checkAdmin(memberId);

    const content = await this.findById(contentId);
    const { type, interests } = content;

    await this.contentRepo.delete(contentId);

    if (type === ContentType.SYMBOL && interests !== null) {
      await this.renormalizeSortOrder(interests);
    }
  }

  async reorderTutorials(
    memberId: string,
    interests: UserInterests,
    dto: BulkReorderDto,
  ): Promise<void> {
    await this.checkAdmin(memberId);

    const { contentIds } = dto;

    if (new Set(contentIds).size !== contentIds.length) {
      throw new BadRequestException("중복된 콘텐츠 ID가 있습니다.");
    }

    const existing = await this.contentRepo.find({
      where: { type: ContentType.SYMBOL, interests },
      select: ["id"],
    });

    if (contentIds.length !== existing.length) {
      throw new BadRequestException(
        `콘텐츠 개수가 일치하지 않습니다. (전달: ${contentIds.length}, 실제: ${existing.length})`,
      );
    }

    const existingIds = new Set(existing.map((c) => c.id));
    for (const id of contentIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`유효하지 않은 콘텐츠 ID입니다: ${id}`);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      for (let i = 0; i < contentIds.length; i++) {
        await manager.update(Content, contentIds[i], { sortOrder: i + 1 });
      }
    });
  }

  private async renormalizeSortOrder(interests: UserInterests): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const contents = await manager.find(Content, {
        where: { type: ContentType.SYMBOL, interests },
        order: { sortOrder: "ASC" },
      });

      const sorted = [
        ...contents.filter((c) => c.sortOrder !== null),
        ...contents.filter((c) => c.sortOrder === null),
      ];

      for (let i = 0; i < sorted.length; i++) {
        await manager.update(Content, sorted[i].id, { sortOrder: i + 1 });
      }
    });
  }
}
