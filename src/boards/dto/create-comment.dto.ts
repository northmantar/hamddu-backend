import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateCommentDto {
  @ApiProperty({ description: "댓글 내용", minLength: 1, maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  body: string;

  @ApiPropertyOptional({ description: "부모 댓글 ID (대댓글인 경우)" })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
