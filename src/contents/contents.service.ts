import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Content } from "@entities/content.entity";
import { Channel } from "@entities/channel.entity";
import { WatchHistory } from "@entities/watch-history.entity";
import { Challenge } from "@entities/challenge.entity";
import { User } from "@entities/user.entity";
import { ContentType } from "@enums/content.enum";
import { UserType } from "@enums/user.enum";
import { ContentQueryDto } from "./dto/content-query.dto";
import { CreateContentDto } from "./dto/create-content.dto";
import { UpdateContentDto } from "./dto/update-content.dto";
import { TutorialQueryDto } from "./dto/tutorial-query.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
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
      relations: ["channel"],
    });

    if (!content) {
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
    return this.contentRepo.find({
      where: {
        type: ContentType.SYMBOL,
        interests: query.interests,
      },
      relations: ["channel"],
      order: { sortOrder: "ASC" },
    });
  }

  async create(memberId: string, dto: CreateContentDto): Promise<Content> {
    await this.checkAdmin(memberId);

    const channel = await this.channelRepo.findOne({ where: { id: dto.channelId } });
    if (!channel) {
      throw new BadRequestException("유효하지 않은 채널입니다.");
    }

    const content = this.contentRepo.create({
      channelId: dto.channelId,
      youtubeVideoId: dto.youtubeVideoId,
      name: dto.name,
      type: dto.type,
      interests: dto.interests ?? null,
      sortOrder: dto.sortOrder ?? null,
      pointApplyable: dto.pointApplyable ?? false,
    });

    const saved = await this.contentRepo.save(content);
    return this.findById(saved.id);
  }

  async update(contentId: string, memberId: string, dto: UpdateContentDto): Promise<Content> {
    await this.checkAdmin(memberId);

    await this.findById(contentId);

    await this.contentRepo.update(contentId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.pointApplyable !== undefined && { pointApplyable: dto.pointApplyable }),
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

    await this.findById(contentId);

    await this.contentRepo.delete(contentId);
  }
}
