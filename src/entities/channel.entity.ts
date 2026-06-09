import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Content } from "./content.entity";
import { ChannelPlatform, ChannelStatus } from "@enums/channel.enum";

@Entity("channels")
export class Channel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "enum", enum: ChannelPlatform })
  platform: ChannelPlatform;

  @Column({ unique: true })
  sourceChannelId: string;

  @Column({ type: "enum", enum: ChannelStatus, default: ChannelStatus.ACTIVE })
  status: ChannelStatus;

  @CreateDateColumn()
  addedAt: Date;

  @OneToMany(() => Content, (content) => content.channel)
  contents: Content[];
}
