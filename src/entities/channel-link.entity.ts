import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ChannelLinkType } from "@enums/channel.enum";
import { Channel } from "./channel.entity";

@Entity("channel_links")
export class ChannelLink {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  channelId: string;

  @ManyToOne(() => Channel, (channel) => channel.links, { onDelete: "CASCADE" })
  @JoinColumn({ name: "channel_id" })
  channel: Channel;

  @Column({ type: "enum", enum: ChannelLinkType })
  type: ChannelLinkType;

  /** type이 etc일 때 노출할 표시명 */
  @Column({ type: "varchar", length: 50, nullable: true })
  label: string | null;

  @Column({ type: "text" })
  url: string;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
