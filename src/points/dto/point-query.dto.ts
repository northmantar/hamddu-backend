import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { PointTransactionType } from "@enums/point.enum";
import { PaginationQueryDto } from "../../boards/dto/pagination.dto";

export class PointTransactionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PointTransactionType, description: "트랜잭션 유형 필터" })
  @IsEnum(PointTransactionType)
  @IsOptional()
  type?: PointTransactionType;
}
