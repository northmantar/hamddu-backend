import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('nickname_nouns')
export class NicknameNoun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  word: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
