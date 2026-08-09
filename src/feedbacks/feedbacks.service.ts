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
}
