import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
import { PaginationQueryDto } from "../../boards/dto/pagination.dto";

export class ChallengeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "특정 콘텐츠에 대한 챌린지만 조회" })
  @IsUUID()
  @IsOptional()
  contentId?: string;
}
