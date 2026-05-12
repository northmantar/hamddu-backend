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
import { PaginationMeta } from "../boards/dto/pagination.dto";

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

  async create(memberId: string, dto: CreateContentDto): Promise<Content> {
    await this.checkAdmin(memberId);

    const channel = await this.channelRepo.findOne({ where: { id: dto.channelId } });
    if (!channel) {
      throw new BadRequestException("유효하지 않은 채널입니다.");
    }

    // 이전 콘텐츠가 지정된 경우 검증
    if (dto.previousContentId) {
      const prevContent = await this.contentRepo.findOne({
        where: { id: dto.previousContentId },
      });
      if (!prevContent) {
        throw new BadRequestException("이전 콘텐츠를 찾을 수 없습니다.");
      }
    }

    const content = this.contentRepo.create({
      channelId: dto.channelId,
      youtubeVideoId: dto.youtubeVideoId,
      name: dto.name,
      type: dto.type,
      interests: dto.interests ?? null,
      previousContentId: dto.previousContentId ?? null,
      pointApplyable: dto.pointApplyable ?? false,
    });

    const saved = await this.contentRepo.save(content);

    // 이전 콘텐츠의 nextContentId 업데이트
    if (dto.previousContentId) {
      await this.contentRepo.update(dto.previousContentId, {
        nextContentId: saved.id,
      });
    }

    return this.findById(saved.id);
  }

  async update(contentId: string, memberId: string, dto: UpdateContentDto): Promise<Content> {
    await this.checkAdmin(memberId);

    const content = await this.findById(contentId);

    // 이전 콘텐츠가 변경되는 경우
    if (dto.previousContentId !== undefined) {
      // 기존 이전 콘텐츠의 nextContentId 해제
      if (content.previousContentId) {
        await this.contentRepo.update(content.previousContentId, {
          nextContentId: null,
        });
      }

      // 새 이전 콘텐츠 검증 및 연결
      if (dto.previousContentId) {
        const prevContent = await this.contentRepo.findOne({
          where: { id: dto.previousContentId },
        });
        if (!prevContent) {
          throw new BadRequestException("이전 콘텐츠를 찾을 수 없습니다.");
        }
        await this.contentRepo.update(dto.previousContentId, {
          nextContentId: contentId,
        });
      }
    }

    await this.contentRepo.update(contentId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.previousContentId !== undefined && { previousContentId: dto.previousContentId }),
      ...(dto.pointApplyable !== undefined && { pointApplyable: dto.pointApplyable }),
    });

    return this.findById(contentId);
  }

  async delete(contentId: string, memberId: string): Promise<void> {
    await this.checkAdmin(memberId);

    const content = await this.findById(contentId);

    // 이전/다음 콘텐츠 연결 해제
    if (content.previousContentId) {
      await this.contentRepo.update(content.previousContentId, {
        nextContentId: null,
      });
    }
    if (content.nextContentId) {
      await this.contentRepo.update(content.nextContentId, {
        previousContentId: null,
      });
    }

    await this.contentRepo.delete(contentId);
  }
}
