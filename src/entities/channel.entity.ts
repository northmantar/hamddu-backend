import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Content } from "./content.entity";
import { ChannelLink } from "./channel-link.entity";
import { Media } from "./media.entity";
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

  // ─── 채널 홈 ───────────────────────────────────────────────────────────────

  @Column({ type: "text", nullable: true })
  description: string | null;

  /** 채널 홈 프로필(로고) 이미지 */
  @Column({ nullable: true })
  profileMediaId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "profile_media_id" })
  profileMedia: Media | null;

  /** 채널 홈 상단 배너(커버) 이미지 */
  @Column({ nullable: true })
  bannerMediaId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "banner_media_id" })
  bannerMedia: Media | null;

  @OneToMany(() => ChannelLink, (link) => link.channel)
  links: ChannelLink[];

  // ──────────────────────────────────────────────────────────────────────────

  @CreateDateColumn()
  addedAt: Date;

  @OneToMany(() => Content, (content) => content.channel)
  contents: Content[];
}
