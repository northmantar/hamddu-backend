import { BadRequestException, Injectable } from '@nestjs/common';
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
    const normalizedBase = this.normalizeNickname(baseNickname);
    const result = await this.dataSource.query(
      `
      INSERT INTO nickname_bases (base_nickname, next_suffix)
      VALUES ($1, 3)
      ON CONFLICT (base_nickname)
      DO UPDATE SET next_suffix = nickname_bases.next_suffix + 1
      RETURNING next_suffix - 1 AS suffix
      `,
      [normalizedBase],
    );

    return Number(result[0].suffix);
  }

  // 닉네임이 이미 사용 중인지 확인 (유저를 생성하지 않음)
  async isNicknameTaken(nickname: string): Promise<boolean> {
    const normalizedNickname = this.normalizeNickname(nickname);
    const result = await this.dataSource.query(
      `SELECT 1 FROM users WHERE nickname = $1 LIMIT 1`,
      [normalizedNickname],
    );

    return result.length > 0;
  }

  // 지정한 유저에게 닉네임을 점유시킨다. 이미 다른 유저가 쓰고 있으면 false.
  async claimNicknameForUser(
    userId: string,
    nickname: string,
  ): Promise<boolean> {
    const normalizedNickname = this.normalizeNickname(nickname);
    try {
      const result = await this.dataSource.query(
        `UPDATE users SET nickname = $1
         WHERE id = $2
           AND NOT EXISTS (
             SELECT 1 FROM users WHERE nickname = $1 AND id != $2
           )
         RETURNING id`,
        [normalizedNickname, userId],
      );
      return result.length > 0;
    } catch (e: any) {
      // 동시 요청이 NOT EXISTS 검사를 함께 통과한 뒤 커밋 시점에 UNIQUE 제약(UQ_users_nickname)이
      // 충돌한 경우. 에러로 터뜨리지 않고 실패로 처리해 호출부의 접미사 재시도 루프가 동작하도록 한다.
      if (e?.code === '23505' || e?.driverError?.code === '23505') {
        return false;
      }
      throw e;
    }
  }

  // base 닉네임을 유저에게 점유시키되, 중복이면 접미사를 붙여 사용 가능한 닉네임으로 확정한다.
  async claimNicknameWithSuffix(
    userId: string,
    base: string,
  ): Promise<string> {
    const normalizedBase = this.normalizeNickname(base);

    if (await this.claimNicknameForUser(userId, normalizedBase)) {
      return normalizedBase;
    }

    while (true) {
      const suffix = await this.allocateSuffix(normalizedBase);
      const nickname = `${normalizedBase}${suffix}`;
      if (await this.claimNicknameForUser(userId, nickname)) {
        return nickname;
      }
    }
  }

  private normalizeNickname(nickname: string): string {
    const normalized = nickname.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    if (normalized.length < 2 || normalized.length > 30) {
      throw new BadRequestException('닉네임은 2자 이상 30자 이하로 입력해주세요.');
    }
    return normalized;
  }
}
