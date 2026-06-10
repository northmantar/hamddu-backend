import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Content } from "./content.entity";

@Entity("watch_histories")
@Unique(["memberId", "contentId"])
export class WatchHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "member_id" })
  member: User;

  @Column()
  contentId: string;

  @ManyToOne(() => Content, (content) => content.watchHistories)
  @JoinColumn({ name: "content_id" })
  content: Content;

  @Column({ type: "int" })
  totalDuration: number;

  @Column({ type: "time" })
  lastWatchedTimestamp: string;

  @Column({ type: "int", default: 0 })
  watchRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastWatchedAt: Date;
}
