import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class EarnXpDto {
  @ApiProperty({ description: "대상 유저 ID", example: "member-uuid" })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ description: "지급할 XP 양", example: 50 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: "참조 테이블 식별자", example: "challenge" })
  @IsString()
  @IsNotEmpty()
  refType: string;

  @ApiProperty({ description: "참조 행의 ID", example: "challenge-uuid" })
  @IsUUID()
  @IsNotEmpty()
  refId: string;

  @ApiPropertyOptional({ description: "트랜잭션 설명", example: "챌린지 완료" })
  @IsString()
  @IsOptional()
  description?: string;
}
