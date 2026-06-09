import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class BulkReorderDto {
  @ApiProperty({
    description: "원하는 순서대로 정렬된 콘텐츠 ID 배열 (해당 interests의 전체 symbol 콘텐츠 포함 필수)",
    type: [String],
    example: ["uuid-3", "uuid-1", "uuid-2"],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("all", { each: true })
  contentIds: string[];
}
