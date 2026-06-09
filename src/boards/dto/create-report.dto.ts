import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { ReportReason } from "@enums/report.enum";

export class CreateReportDto {
  @ApiProperty({
    description: "신고 사유",
    enum: ReportReason,
    example: ReportReason.SPAM,
  })
  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason: ReportReason;

  @ApiPropertyOptional({
    description: "신고 상세 내용",
    maxLength: 1000,
    example: "광고성 게시글입니다.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
