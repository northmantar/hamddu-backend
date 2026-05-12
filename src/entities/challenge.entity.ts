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

@Entity("challenges")
@Unique(["memberId", "contentId"])
export class Challenge {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "memberId" })
  member: User;

  @Column()
  contentId: string;

  @ManyToOne(() => Content, (content) => content.challenges)
  @JoinColumn({ name: "contentId" })
  content: Content;

  @Column({ type: "text", nullable: true })
  title: string | null;

  @Column({ type: "text", nullable: true })
  body: string | null;

  @Column({ type: "text", nullable: true })
  imageUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
