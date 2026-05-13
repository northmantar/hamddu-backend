import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class EarnPointDto {
  @ApiProperty({ description: "대상 유저 ID", example: "member-uuid" })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ description: "적용할 포인트 정책 ID", example: "policy-uuid" })
  @IsUUID()
  @IsNotEmpty()
  policyId: string;

  @ApiProperty({ description: "참조 테이블 식별자", example: "challenge" })
  @IsString()
  @IsNotEmpty()
  refType: string;

  @ApiProperty({ description: "참조 행의 ID", example: "challenge-uuid" })
  @IsUUID()
  @IsNotEmpty()
  refId: string;

  @ApiPropertyOptional({ description: "트랜잭션 설명", example: "챌린지 완료 보상" })
  @IsString()
  @IsOptional()
  description?: string;
}
