import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Channel } from "@entities/channel.entity";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { UpdateChannelDto } from "./dto/update-channel.dto";

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

  async update(id: string, dto: UpdateChannelDto): Promise<Channel> {
    await this.findById(id);

    await this.channelRepo.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.channelRepo.delete(id);
  }
}
