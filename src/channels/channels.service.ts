import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Channel } from "@entities/channel.entity";
import { ChannelLink } from "@entities/channel-link.entity";
import { Media } from "@entities/media.entity";
import { ChannelLinkType } from "@enums/channel.enum";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { UpdateChannelDto } from "./dto/update-channel.dto";
import { ChannelLinkInputDto } from "./dto/channel-link.dto";

/** 채널 홈 조회 시 함께 로드할 관계 */
const HOME_RELATIONS = ["profileMedia", "bannerMedia", "links"];

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
    @InjectRepository(ChannelLink)
    private readonly channelLinkRepo: Repository<ChannelLink>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
  ) {}

  async findAll(): Promise<Channel[]> {
    return this.channelRepo.find({
      order: { addedAt: "DESC" },
    });
  }

  async create(dto: CreateChannelDto): Promise<Channel> {
    const existing = await this.channelRepo.findOne({
      where: { sourceChannelId: dto.sourceChannelId },
    });

    if (existing) {
      throw new ConflictException("이미 등록된 채널입니다.");
    }

    const channel = this.channelRepo.create({
      name: dto.name,
      platform: dto.platform,
      sourceChannelId: dto.sourceChannelId,
    });

    return this.channelRepo.save(channel);
  }

  async findById(id: string): Promise<Channel> {
    const channel = await this.channelRepo.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException("채널을 찾을 수 없습니다.");
    }
    return channel;
  }

  /** 채널 홈 상세 조회 (소개글 + 이미지 + 외부 링크 포함) */
  async findHomeById(id: string): Promise<Channel> {
    const channel = await this.channelRepo.findOne({
      where: { id },
      relations: HOME_RELATIONS,
    });

    if (!channel) {
      throw new NotFoundException("채널을 찾을 수 없습니다.");
    }

    return channel;
  }

  async update(id: string, dto: UpdateChannelDto): Promise<Channel> {
    await this.findById(id);

    await this.validateMediaIds([dto.profileMediaId, dto.bannerMediaId]);

    await this.channelRepo.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.profileMediaId !== undefined && { profileMediaId: dto.profileMediaId }),
      ...(dto.bannerMediaId !== undefined && { bannerMediaId: dto.bannerMediaId }),
    });

    if (dto.links !== undefined) {
      await this.replaceLinks(id, dto.links);
    }

    return this.findHomeById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.channelRepo.delete(id);
  }

  /**
   * 채널의 외부 링크를 전량 교체한다.
   * 배열 순서가 그대로 sortOrder가 되며, 빈 배열이면 전부 삭제된다.
   */
  private async replaceLinks(channelId: string, links: ChannelLinkInputDto[]): Promise<void> {
    const etcWithoutLabel = links.find(
      (link) => link.type === ChannelLinkType.ETC && !link.label?.trim(),
    );
    if (etcWithoutLabel) {
      throw new BadRequestException("etc 타입 링크는 표시명(label)이 필요합니다.");
    }

    await this.channelLinkRepo.delete({ channelId });

    if (links.length === 0) {
      return;
    }

    await this.channelLinkRepo.insert(
      links.map((link, index) => ({
        channelId,
        type: link.type,
        label: link.label?.trim() || null,
        url: link.url,
        sortOrder: index,
      })),
    );
  }

  /** 전달된 미디어 ID가 실제로 존재하는지 확인한다. null/undefined는 검사 대상이 아니다. */
  private async validateMediaIds(mediaIds: Array<string | null | undefined>): Promise<void> {
    const ids = [...new Set(mediaIds.filter((id): id is string => !!id))];
    if (ids.length === 0) {
      return;
    }

    const count = await this.mediaRepo.countBy({ id: In(ids) });
    if (count !== ids.length) {
      throw new BadRequestException("유효하지 않은 미디어 ID가 포함되어 있습니다.");
    }
  }
}
