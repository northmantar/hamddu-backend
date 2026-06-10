import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  Column,
} from "typeorm";
import { User } from "./user.entity";
import { BoardComment } from "./board-comment.entity";

@Entity("board_comment_likes")
@Unique(["commentId", "memberId"])
export class BoardCommentLike {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  commentId: string;

  @ManyToOne(() => BoardComment, (comment) => comment.likes)
  @JoinColumn({ name: "comment_id" })
  comment: BoardComment;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "member_id" })
  member: User;

  @CreateDateColumn()
  createdAt: Date;
}
