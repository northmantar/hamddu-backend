import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

/** 유저 의견함. 작성 후 수정/삭제는 없고 쌓기만 한다. */
@Entity("feedbacks")
export class Feedback {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  memberId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "member_id" })
  member: User | null;

  @Column({ type: "text" })
  body: string;

  @CreateDateColumn()
  createdAt: Date;
}
