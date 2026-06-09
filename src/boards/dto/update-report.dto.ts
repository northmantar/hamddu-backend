import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { ReportStatus } from "@enums/report.enum";

export class UpdateReportDto {
  @ApiProperty({
    description: "변경할 신고 상태",
    enum: [ReportStatus.RESOLVED, ReportStatus.REJECTED],
    example: ReportStatus.RESOLVED,
  })
  @IsEnum([ReportStatus.RESOLVED, ReportStatus.REJECTED])
  @IsNotEmpty()
  status: ReportStatus.RESOLVED | ReportStatus.REJECTED;
}
