import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Channel } from "@entities/channel.entity";
import { CreateChannelDto } from "./dto/create-channel.dto";

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
  ) {}

  async findAll(): Promise<Channel[]> {
    return this.channelRepo.find({
      order: { addedAt: "DESC" },
    });
  }

  async create(dto: CreateChannelDto): Promise<Channel> {
    // 중복 채널 확인
    const existing = await this.channelRepo.findOne({
      where: { youtubeChannelId: dto.youtubeChannelId },
    });

    if (existing) {
      throw new ConflictException("이미 등록된 채널입니다.");
    }

    const channel = this.channelRepo.create({
      name: dto.name,
      youtubeChannelId: dto.youtubeChannelId,
    });

    return this.channelRepo.save(channel);
  }
}
