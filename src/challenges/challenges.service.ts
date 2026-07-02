import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Challenge } from "@entities/challenge.entity";
import { Content } from "@entities/content.entity";
import { CreateChallengeDto } from "./dto/create-challenge.dto";
import { ChallengeQueryDto } from "./dto/challenge-query.dto";
import { PaginationQueryDto, PaginationMeta } from "../boards/dto/pagination.dto";
import { RewardsService } from "../rewards/rewards.service";
import { RewardAction } from "../rewards/constants/reward-events";

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    private readonly rewardsService: RewardsService,
  ) {}

  async findAll(
    query: ChallengeQueryDto,
  ): Promise<{ data: Challenge[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, contentId } = query;
    const skip = (page - 1) * limit;

    const qb = this.challengeRepo
      .createQueryBuilder("challenge")
      .leftJoinAndSelect("challenge.content", "content")
      .leftJoinAndSelect("challenge.member", "member")
      .leftJoinAndSelect("challenge.media", "media")
      .orderBy("challenge.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (contentId) {
      qb.where("challenge.contentId = :contentId", { contentId });
    }

    const [data, totalCount] = await qb.getManyAndCount();

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

  async findById(id: string): Promise<Challenge> {
    const challenge = await this.challengeRepo.findOne({
      where: { id },
      relations: ["content", "member", "media"],
    });

    if (!challenge) {
      throw new NotFoundException("챌린지를 찾을 수 없습니다.");
    }

    return challenge;
  }

  async findMyList(
    memberId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: Challenge[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await this.challengeRepo.findAndCount({
      where: { memberId },
      relations: ["content", "media"],
      order: { createdAt: "DESC" },
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

  async create(
    memberId: string,
    dto: CreateChallengeDto,
  ): Promise<{ challenge: Challenge }> {
    // 콘텐츠 존재 여부 확인
    const content = await this.contentRepo.findOne({ where: { id: dto.contentId } });
    if (!content) {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    // 이미 해당 콘텐츠에 대한 챌린지가 있는지 확인
    const existing = await this.challengeRepo.findOne({
      where: { memberId, contentId: dto.contentId },
    });

    if (existing) {
      throw new ConflictException("이미 해당 콘텐츠에 대한 챌린지를 완료했습니다.");
    }

    const challenge = this.challengeRepo.create({
      memberId,
      contentId: dto.contentId,
      title: dto.title ?? null,
      body: dto.body ?? null,
      mediaId: dto.mediaId ?? null,
    });

    const saved = await this.challengeRepo.save(challenge);

    // 저장된 챌린지를 relations와 함께 다시 조회
    const result = await this.findById(saved.id);

    // 포인트/XP 백그라운드 지급 큐 등록
    await this.rewardsService.enqueueReward({
      memberId,
      refType: 'challenge',
      refAction: RewardAction.CREATE,
      refId: saved.id,
      metadata: { pointApplyable: content.pointApplyable },
    });

    return { challenge: result };
  }

  async existsByMemberAndContent(memberId: string, contentId: string): Promise<boolean> {
    return this.challengeRepo.existsBy({ memberId, contentId });
  }
}
