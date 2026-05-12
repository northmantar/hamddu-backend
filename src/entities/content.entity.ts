import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ContentType } from "@enums/content.enum";
import { UserInterests } from "@enums/user.enum";
import { Channel } from "./channel.entity";
import { WatchHistory } from "./watch-history.entity";
import { Challenge } from "./challenge.entity";

@Entity("contents")
export class Content {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  channelId: string;

  @ManyToOne(() => Channel, (channel) => channel.contents)
  @JoinColumn({ name: "channelId" })
  channel: Channel;

  @Column({ unique: true })
  youtubeVideoId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "enum", enum: ContentType })
  type: ContentType;

  @Column({ type: "enum", enum: UserInterests, nullable: true })
  interests: UserInterests | null;

  @Column({ type: "uuid", nullable: true })
  previousContentId: string | null;

  @OneToOne(() => Content, { nullable: true })
  @JoinColumn({ name: "previousContentId" })
  previousContent: Content | null;

  @Column({ type: "uuid", nullable: true })
  nextContentId: string | null;

  @OneToOne(() => Content, { nullable: true })
  @JoinColumn({ name: "nextContentId" })
  nextContent: Content | null;

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
