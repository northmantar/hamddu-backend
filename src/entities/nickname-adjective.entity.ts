import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('nickname_adjectives')
export class NicknameAdjective {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  word: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
