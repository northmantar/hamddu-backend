import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { ReportStatus } from "@enums/report.enum";
import { PaginationQueryDto } from "./pagination.dto";

export class ReportQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "신고 상태 필터",
    enum: ReportStatus,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
