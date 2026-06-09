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
import { BoardStatus } from "@enums/board.enum";
import { User } from "./user.entity";
import { BoardCategory } from "./board-category.entity";
import { BoardComment } from "./board-comment.entity";
import { BoardLike } from "./board-like.entity";
import { BoardMedia } from "./board-media.entity";
import { Media } from "./media.entity";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: BoardStatus,
    default: BoardStatus.PUBLISHED,
  })
  status: BoardStatus;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "memberId" })
  member: User;

  @Column()
  categoryId: string;

  @ManyToOne(() => BoardCategory, (category) => category.boards)
  @JoinColumn({ name: "categoryId" })
  category: BoardCategory;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "int", default: 0 })
  likeCount: number;

  @Column({ type: "boolean", default: false })
  isHidden: boolean;

  @Column({ nullable: true })
  thumbnailMediaId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "thumbnail_media_id" })
  thumbnailMedia: Media | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => BoardComment, (comment) => comment.board)
  comments: BoardComment[];

  @OneToMany(() => BoardLike, (like) => like.board)
  likes: BoardLike[];

  @OneToMany(() => BoardMedia, (bm) => bm.board)
  boardMedia: BoardMedia[];
}
