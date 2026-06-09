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
import { BoardComment } from "./board-comment.entity";
import { ReportReason, ReportStatus } from "../enums";

@Entity("comment_reports")
@Unique(["commentId", "reporterId"])
export class CommentReport {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  commentId: string;

  @ManyToOne(() => BoardComment)
  @JoinColumn({ name: "commentId" })
  comment: BoardComment;

  @Column()
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "reporterId" })
  reporter: User;

  @Column({ type: "enum", enum: ReportReason })
  reason: ReportReason;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "enum", enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  processedAt: Date | null;
}
