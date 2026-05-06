import { NicknameAdjective } from "@entities/nickname-adjective.entity";
import { NicknameNoun } from "@entities/nickname-noun.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NicknameBase } from "@entities/nickname-base.entity";
import { NicknameSequenceService } from "./nickname-sequence.service";

@Injectable()
export class NicknamesService {
  constructor(
    @InjectRepository(NicknameAdjective)
    private readonly adjectiveRepo: Repository<NicknameAdjective>,
    @InjectRepository(NicknameNoun)
    private readonly nounRepo: Repository<NicknameNoun>,
    @InjectRepository(NicknameBase)
    private readonly nicknameBaseRepo: Repository<NicknameBase>,
    private readonly nicknameSequenceService: NicknameSequenceService,
  ) {}

  // 닉네임 중복 체크
  async check(value: string): Promise<boolean> {
    const base = await this.nicknameBaseRepo.findOne({
      where: { baseNickname: value },
    });
    return !!base;
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

  // 닉네임 생성 (랜덤)
  async issueNickname(): Promise<string> {
    const base = await this.generateBaseNickname();
    if (await this.nicknameSequenceService.tryInsertNickname(base)) {
      return base;
    }

    while (true) {
      const suffix = await this.nicknameSequenceService.allocateSuffix(base);
      const nickname = `${base}${suffix}`;
      if (await this.nicknameSequenceService.tryInsertNickname(nickname)) {
        return nickname;
      }
    }
  }

  // 닉네임 등록 (수동 입력)
  async registerNickname(value: string) {
    if (await this.nicknameSequenceService.tryInsertNickname(value)) {
      return value;
    }

    while (true) {
      const suffix = await this.nicknameSequenceService.allocateSuffix(value);
      const nickname = `${value}${suffix}`;
      if (await this.nicknameSequenceService.tryInsertNickname(nickname)) {
        return nickname;
      }
    }
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