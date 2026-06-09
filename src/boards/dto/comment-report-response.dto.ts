import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReportReason, ReportStatus } from "@enums/report.enum";
import { CommentReport } from "@entities/comment-report.entity";

export class CommentReporterDto {
  @ApiProperty({ example: "reporter-uuid" })
  id: string;

  @ApiProperty({ example: "신고자닉네임" })
  nickname: string;
}

export class ReportedCommentDto {
  @ApiProperty({ example: "comment-uuid" })
  id: string;

  @ApiProperty({ example: "신고된 댓글 내용" })
  body: string;

  @ApiProperty({ example: "board-uuid" })
  boardId: string;
}

export class CommentReportResponseDto {
  @ApiProperty({ example: "report-uuid" })
  id: string;

  @ApiProperty({ enum: ReportReason, example: ReportReason.SPAM })
  reason: ReportReason;

  @ApiPropertyOptional({ example: "스팸 댓글입니다." })
  description: string | null;

  @ApiProperty({ enum: ReportStatus, example: ReportStatus.PENDING })
  status: ReportStatus;

  @ApiProperty({ example: "2026-04-09T12:00:00.000Z" })
  createdAt: Date;

  @ApiPropertyOptional({ example: "2026-04-10T12:00:00.000Z" })
  processedAt: Date | null;

  static from(report: CommentReport): CommentReportResponseDto {
    return {
      id: report.id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      processedAt: report.processedAt,
    };
  }
}

export class CommentReportDetailDto extends CommentReportResponseDto {
  @ApiProperty({ type: CommentReporterDto })
  reporter: CommentReporterDto;

  @ApiProperty({ type: ReportedCommentDto })
  comment: ReportedCommentDto;

  static fromWithDetails(report: CommentReport): CommentReportDetailDto {
    return {
      ...CommentReportResponseDto.from(report),
      reporter: {
        id: report.reporter.id,
        nickname: report.reporter.nickname ?? "",
      },
      comment: {
        id: report.comment.id,
        body: report.comment.body,
        boardId: report.comment.boardId,
      },
    };
  }
}

export class CreateCommentReportResponseDto {
  @ApiProperty({ example: "report-uuid" })
  id: string;

  @ApiProperty({ example: "comment-uuid" })
  commentId: string;

  @ApiProperty({ example: "신고가 접수되었습니다." })
  message: string;
}
