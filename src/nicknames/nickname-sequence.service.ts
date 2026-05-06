import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class NicknameSequenceService {
  constructor(private readonly dataSource: DataSource) {}

  async nextComboSeq(): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT nextval('nickname_combo_seq') AS value
    `);

    return Number(result[0].value);
  }

  async allocateSuffix(baseNickname: string): Promise<number> {
    const result = await this.dataSource.query(
      `
      INSERT INTO nickname_bases (base_nickname, next_suffix)
      VALUES ($1, 3)
      ON CONFLICT (base_nickname)
      DO UPDATE SET next_suffix = nickname_bases.next_suffix + 1
      RETURNING next_suffix - 1 AS suffix
      `,
      [baseNickname],
    );

    return Number(result[0].suffix);
  }

  async tryInsertNickname(nickname: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
      INSERT INTO users (nickname)
      VALUES ($1)
      ON CONFLICT (nickname) DO NOTHING
      RETURNING nickname
      `,
      [nickname],
    );

    return result.length > 0;
  }
}
