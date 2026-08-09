import { ApiProperty } from "@nestjs/swagger";
import { Feedback } from "@entities/feedback.entity";

export class FeedbackResponseDto {
  @ApiProperty({ example: "feedback-uuid" })
  id: string;

  @ApiProperty({ example: "튜토리얼에 자막이 있으면 좋겠어요." })
  body: string;

  @ApiProperty({ example: "2026-08-09T12:00:00.000Z" })
  createdAt: Date;

  static from(feedback: Feedback): FeedbackResponseDto {
    return {
      id: feedback.id,
      body: feedback.body,
      createdAt: feedback.createdAt,
    };
  }
}
