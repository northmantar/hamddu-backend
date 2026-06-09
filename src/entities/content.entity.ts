import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ContentType, ContentStatus } from "@enums/content.enum";
import { UserInterests } from "@enums/user.enum";
import { Channel } from "./channel.entity";
import { WatchHistory } from "./watch-history.entity";
import { Challenge } from "./challenge.entity";
import { Media } from "./media.entity";

@Entity("contents")
export class Content {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  channelId: string | null;

  @ManyToOne(() => Channel, (channel) => channel.contents)
  @JoinColumn({ name: "channel_id" })
  channel: Channel;

  @Column({ unique: true })
  sourceVideoId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "enum", enum: ContentType })
  type: ContentType;

  @Column({ type: "enum", enum: ContentStatus, default: ContentStatus.ACTIVE })
  status: ContentStatus;

  @Column({ type: "enum", enum: UserInterests, nullable: true })
  interests: UserInterests | null;

  @Column({ type: "int", nullable: true })
  sortOrder: number | null;

  @Column({ nullable: true })
  mediaId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "media_id" })
  media: Media | null;

  @Column({ default: false })
  pointApplyable: boolean;

  @Column({ type: "timestamptz", nullable: true })
  uploadedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WatchHistory, (watchHistory) => watchHistory.content)
  watchHistories: WatchHistory[];

  @OneToMany(() => Challenge, (challenge) => challenge.content)
  challenges: Challenge[];
}
