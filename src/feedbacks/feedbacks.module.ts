import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FeedbacksController } from "./feedbacks.controller";
import { FeedbacksService } from "./feedbacks.service";
import { Feedback } from "@entities/feedback.entity";
import { User } from "@entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, User])],
  controllers: [FeedbacksController],
  providers: [FeedbacksService],
})
export class FeedbacksModule {}
