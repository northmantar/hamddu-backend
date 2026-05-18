import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class UpdateOrderDto {
  @ApiProperty({ description: "새로운 정렬 순서 (1부터 시작)", example: 3 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  sortOrder: number;
}
