import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { CampaignType } from "../../enums/notification.enum";

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: "FCM 디바이스 토큰" })
  @IsString()
  token: string;

  @ApiPropertyOptional({ description: "플랫폼(ios/android 등)" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  platform?: string;
}

export class CreateCampaignDto {
  @ApiProperty({ enum: CampaignType })
  @IsEnum(CampaignType)
  type: CampaignType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: "ANNOUNCEMENT 발송 시각(ISO8601)" })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: "BATCH cron 패턴 (예: '0 9 * * *')" })
  @IsOptional()
  @IsString()
  cron?: string;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: "ANNOUNCEMENT 발송 시각(ISO8601)" })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: "BATCH cron 패턴" })
  @IsOptional()
  @IsString()
  cron?: string;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "{level}, {label} 치환 가능" })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
