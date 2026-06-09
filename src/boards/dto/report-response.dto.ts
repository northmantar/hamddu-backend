import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReportReason, ReportStatus } from "@enums/report.enum";
import { BoardReport } from "@entities/board-report.entity";

export class ReporterDto {
  @ApiProperty({ example: "reporter-uuid" })
  id: string;

  @ApiProperty({ example: "신고자닉네임" })
  nickname: string;
}

export class ReportedBoardDto {
  @ApiProperty({ example: "board-uuid" })
  id: string;

  @ApiProperty({ example: "신고된 게시글 제목" })
  title: string;
}

export class ReportResponseDto {
  @ApiProperty({ example: "report-uuid" })
  id: string;

  @ApiProperty({ enum: ReportReason, example: ReportReason.SPAM })
  reason: ReportReason;

  @ApiPropertyOptional({ example: "광고성 게시글입니다." })
  description: string | null;

  @ApiProperty({ enum: ReportStatus, example: ReportStatus.PENDING })
  status: ReportStatus;

  @ApiProperty({ example: "2026-04-09T12:00:00.000Z" })
  createdAt: Date;

  @ApiPropertyOptional({ example: "2026-04-10T12:00:00.000Z" })
  processedAt: Date | null;

  static from(report: BoardReport): ReportResponseDto {
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

export class ReportDetailDto extends ReportResponseDto {
  @ApiProperty({ type: ReporterDto })
  reporter: ReporterDto;

  @ApiProperty({ type: ReportedBoardDto })
  board: ReportedBoardDto;

  static fromWithDetails(report: BoardReport): ReportDetailDto {
    return {
      ...ReportResponseDto.from(report),
      reporter: {
        id: report.reporter.id,
        nickname: report.reporter.nickname ?? "",
      },
      board: {
        id: report.board.id,
        title: report.board.title,
      },
    };
  }
}

export class CreateReportResponseDto {
  @ApiProperty({ example: "report-uuid" })
  id: string;

  @ApiProperty({ example: "board-uuid" })
  boardId: string;

  @ApiProperty({ example: "신고가 접수되었습니다." })
  message: string;
}
