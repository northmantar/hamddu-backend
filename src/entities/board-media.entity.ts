import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Board } from "./board.entity";
import { Media } from "./media.entity";

@Entity("board_media")
export class BoardMedia {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  boardId: string;

  @ManyToOne(() => Board, (board) => board.boardMedia, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board: Board;

  @Column()
  mediaId: string;

  @ManyToOne(() => Media, { onDelete: "CASCADE" })
  @JoinColumn({ name: "media_id" })
  media: Media;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
