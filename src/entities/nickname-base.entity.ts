import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('nickname_bases')
export class NicknameBase {
  @PrimaryColumn({ type: 'text' })
  baseNickname: string;

  @Column({ type: 'bigint', default: 2 })
  nextSuffix: number;
}
