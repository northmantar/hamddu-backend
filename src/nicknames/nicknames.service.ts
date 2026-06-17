import { NicknameAdjective } from "@entities/nickname-adjective.entity";
import { NicknameNoun } from "@entities/nickname-noun.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NicknameSequenceService } from "./nickname-sequence.service";

@Injectable()
export class NicknamesService {
  constructor(
    @InjectRepository(NicknameAdjective)
    private readonly adjectiveRepo: Repository<NicknameAdjective>,
    @InjectRepository(NicknameNoun)
    private readonly nounRepo: Repository<NicknameNoun>,
    private readonly nicknameSequenceService: NicknameSequenceService,
  ) {}

  // 닉네임 중복 체크 (사용 중인 유저가 있는지 확인)
  async check(value: string): Promise<boolean> {
    return this.nicknameSequenceService.isNicknameTaken(value);
  }

  // 닉네임 후보 목록 (랜덤, 시퀀스 소비 없음)
  async getCandidates(count: number): Promise<string[]> {
    const adjectives = await this.adjectiveRepo.findBy({ isActive: true });
    const nouns = await this.nounRepo.findBy({ isActive: true });

    const seen = new Set<string>();
    const results: string[] = [];

    while (results.length < count) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const candidate = `${adj.word} ${noun.word}`;
      if (!seen.has(candidate)) {
        seen.add(candidate);
        results.push(candidate);
      }
    }

    return results;
  }

  // 닉네임 자동 발급 (사용 가능한 닉네임 후보만 반환, 유저 생성 없음)
  async issueNickname(): Promise<string> {
    const base = await this.generateBaseNickname();
    if (!(await this.nicknameSequenceService.isNicknameTaken(base))) {
      return base;
    }

    while (true) {
      const suffix = await this.nicknameSequenceService.allocateSuffix(base);
      const nickname = `${base}${suffix}`;
      if (!(await this.nicknameSequenceService.isNicknameTaken(nickname))) {
        return nickname;
      }
    }
  }

  // 닉네임 등록 (인증 유저가 입력한 닉네임을 자기 계정에 점유, 중복 시 접미사 부여)
  async registerNickname(userId: string, value: string): Promise<string> {
    return this.nicknameSequenceService.claimNicknameWithSuffix(userId, value);
  }

  //======================================
  // Private Functions
  //======================================

  // 최대공약수
  private gcd(a: number, b: number): number {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  // 서로소 관계를 만족하는 수 선택
  private pickCoprimeStep(total: number, seed = 97): number {
    let step = seed % total;
    if (step === 0) step = 1;

    while (this.gcd(step, total) !== 1) {
      step++;
      if (step >= total) step = 1;
    }
    return step;
  }

  private mapIndexToPair(index: number, nounCount: number) {
    const adjectiveIndex = Math.floor(index / nounCount);
    const nounIndex = index % nounCount;
    return { adjectiveIndex, nounIndex };
  }

  private async generateBaseNickname(): Promise<string> {
    const adjectives = await this.adjectiveRepo.findBy({ isActive: true });
    const nouns = await this.nounRepo.findBy({ isActive: true });

    const m = adjectives.length;
    const n = nouns.length;
    const total = m * n;
    const seq = await this.nicknameSequenceService.nextComboSeq();

    const offset = 17; // temporary value
    const step = this.pickCoprimeStep(total, 97);

    const index = (offset + seq * step) % total;
    const { adjectiveIndex, nounIndex } = this.mapIndexToPair(index, n);
    return `${adjectives[adjectiveIndex].word} ${nouns[nounIndex].word}`;
  }
}