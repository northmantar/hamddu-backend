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
import { Board } from "./board.entity";

@Entity("board_likes")
@Unique(["boardId", "memberId"])
export class BoardLike {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  boardId: string;

  @ManyToOne(() => Board, (board) => board.likes)
  @JoinColumn({ name: "board_id" })
  board: Board;

  @Column()
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "member_id" })
  member: User;

  @CreateDateColumn()
  createdAt: Date;
}
