import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";
import { Content } from "./content.entity";
import { Media } from "./media.entity";

@Entity("challenges")
@Unique(["memberId", "contentId"])
export class Challenge {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "member_id" })
  member: User;

  @Column()
  contentId: string;

  @ManyToOne(() => Content, (content) => content.challenges)
  @JoinColumn({ name: "content_id" })
  content: Content;

  @Column({ type: "text", nullable: true })
  title: string | null;

  @Column({ type: "text", nullable: true })
  body: string | null;

  @Column({ nullable: true })
  mediaId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "media_id" })
  media: Media | null;

  @CreateDateColumn()
  createdAt: Date;
}
