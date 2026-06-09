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
import { Board } from "./board.entity";
import { ReportReason, ReportStatus } from "../enums";

@Entity("board_reports")
@Unique(["boardId", "reporterId"])
export class BoardReport {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  boardId: string;

  @ManyToOne(() => Board)
  @JoinColumn({ name: "board_id" })
  board: Board;

  @Column()
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "reporter_id" })
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
