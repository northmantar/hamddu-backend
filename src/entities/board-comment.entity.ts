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
import { User } from "./user.entity";
import { Board } from "./board.entity";
import { BoardCommentLike } from "./board-comment-like.entity";

@Entity("board_comments")
export class BoardComment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  boardId: string;

  @ManyToOne(() => Board, (board) => board.comments)
  @JoinColumn({ name: "board_id" })
  board: Board;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "member_id" })
  member: User;

  @Column({ type: "uuid", nullable: true })
  parentId: string | null;

  @ManyToOne(() => BoardComment, (comment) => comment.children, {
    nullable: true,
  })
  @JoinColumn({ name: "parent_id" })
  parent: BoardComment | null;

  @OneToMany(() => BoardComment, (comment) => comment.parent)
  children: BoardComment[];

  @Column({ type: "text" })
  body: string;

  @Column({ type: "int", default: 0 })
  depth: number;

  @Column({ type: "int", default: 0 })
  likeCount: number;

  @Column({ type: "boolean", default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => BoardCommentLike, (like) => like.comment)
  likes: BoardCommentLike[];
}
