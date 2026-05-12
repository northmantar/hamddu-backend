import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Content } from "./content.entity";

@Entity("channels")
export class Channel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true })
  youtubeChannelId: string;

  @CreateDateColumn()
  addedAt: Date;

  @OneToMany(() => Content, (content) => content.channel)
  contents: Content[];
}
