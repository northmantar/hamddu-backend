import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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

/** 어드민 목록용 (작성자 포함) */
export class FeedbackListItemDto extends FeedbackResponseDto {
  @ApiPropertyOptional({ example: "user-uuid", nullable: true, description: "작성자 ID" })
  memberId: string | null;

  @ApiPropertyOptional({ example: "실뭉치장인", nullable: true, description: "작성자 닉네임" })
  nickname: string | null;

  @ApiPropertyOptional({ example: "user@example.com", nullable: true, description: "작성자 이메일" })
  email: string | null;

  static fromWithMember(feedback: Feedback): FeedbackListItemDto {
    return {
      ...FeedbackResponseDto.from(feedback),
      memberId: feedback.memberId,
      nickname: feedback.member?.nickname ?? null,
      email: feedback.member?.email ?? null,
    };
  }
}
