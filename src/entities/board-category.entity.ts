import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BoardCategoryStatus } from "@enums/board.enum";
import { Board } from "./board.entity";

@Entity("board_categories")
export class BoardCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  label: string;

  @Column({
    type: "enum",
    enum: BoardCategoryStatus,
    default: BoardCategoryStatus.ENABLED,
  })
  status: BoardCategoryStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Board, (board) => board.category)
  boards: Board[];
}
