import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Challenge } from "@entities/challenge.entity";

export class ChallengeContentDto {
  @ApiProperty({ example: "content-uuid" })
  id: string;

  @ApiProperty({ example: "코바늘 기초 - 사슬뜨기" })
  name: string;

  @ApiPropertyOptional({ example: "symbol" })
  type?: string;
}

export class ChallengeAuthorDto {
  @ApiProperty({ example: "author-uuid" })
  id: string;

  @ApiProperty({ example: "실뭉치장인" })
  nickname: string;
}

export class ChallengeListItemDto {
  @ApiProperty({ example: "challenge-uuid" })
  id: string;

  @ApiPropertyOptional({ example: "사슬뜨기 완성!" })
  title: string | null;

  @ApiPropertyOptional({ example: "드디어 첫 작품을 완성했어요!" })
  body: string | null;

  @ApiPropertyOptional({ example: "https://cdn.hamddu.com/challenges/image.jpg" })
  imageUrl: string | null;

  @ApiProperty({ type: ChallengeContentDto })
  content: ChallengeContentDto;

  @ApiProperty({ type: ChallengeAuthorDto })
  author: ChallengeAuthorDto;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  createdAt: Date;

  static from(challenge: Challenge): ChallengeListItemDto {
    return {
      id: challenge.id,
      title: challenge.title,
      body: challenge.body,
      imageUrl: challenge.imageUrl,
      content: {
        id: challenge.content.id,
        name: challenge.content.name,
      },
      author: {
        id: challenge.member.id,
        nickname: challenge.member.nickname ?? "",
      },
      createdAt: challenge.createdAt,
    };
  }
}

export class ChallengeDetailDto extends ChallengeListItemDto {
  @ApiProperty({ example: true })
  imageUploaded: boolean;

  @ApiProperty({ example: true })
  stampGranted: boolean;

  static fromDetail(challenge: Challenge): ChallengeDetailDto {
    const base = ChallengeListItemDto.from(challenge);
    return {
      ...base,
      content: {
        id: challenge.content.id,
        name: challenge.content.name,
        type: challenge.content.type,
      },
      imageUploaded: !!challenge.imageUrl,
      stampGranted: true, // 챌린지 등록 시 스탬프 부여
    };
  }
}

export class ChallengeCreateResponseDto extends ChallengeDetailDto {
  @ApiPropertyOptional({ example: 100 })
  pointEarned?: number;

  @ApiPropertyOptional({ example: 50 })
  xpEarned?: number;
}

export class MyChallengeListItemDto {
  @ApiProperty({ example: "challenge-uuid" })
  id: string;

  @ApiPropertyOptional({ example: "사슬뜨기 완성!" })
  title: string | null;

  @ApiPropertyOptional({ example: "https://cdn.hamddu.com/challenges/image.jpg" })
  imageUrl: string | null;

  @ApiProperty({ example: true })
  imageUploaded: boolean;

  @ApiProperty({ example: true })
  stampGranted: boolean;

  @ApiProperty({ type: ChallengeContentDto })
  content: ChallengeContentDto;

  @ApiProperty({ example: "2026-04-09T16:00:00.000Z" })
  createdAt: Date;

  static from(challenge: Challenge): MyChallengeListItemDto {
    return {
      id: challenge.id,
      title: challenge.title,
      imageUrl: challenge.imageUrl,
      imageUploaded: !!challenge.imageUrl,
      stampGranted: true,
      content: {
        id: challenge.content.id,
        name: challenge.content.name,
      },
      createdAt: challenge.createdAt,
    };
  }
}
