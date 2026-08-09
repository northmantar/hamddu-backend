import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Feedback } from "@entities/feedback.entity";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  async create(memberId: string, dto: CreateFeedbackDto): Promise<Feedback> {
    return this.feedbackRepo.save(
      this.feedbackRepo.create({ memberId, body: dto.body.trim() }),
    );
  }

  /** 어드민 의견 목록 (최신순) */
  async findAll(page: number, limit: number): Promise<{ data: Feedback[]; totalCount: number }> {
    const [data, totalCount] = await this.feedbackRepo.findAndCount({
      relations: ["member"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, totalCount };
  }
}
