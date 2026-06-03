import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("media")
export class Media {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  uploaderId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "uploader_id" })
  uploader: User | null;

  @Column({ type: "text" })
  url: string;

  @Column({ length: 100, nullable: true })
  mimeType: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
