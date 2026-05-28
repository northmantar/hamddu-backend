import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ChallengesService } from "./challenges.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { CreateChallengeDto } from "./dto/create-challenge.dto";
import { ChallengeQueryDto } from "./dto/challenge-query.dto";
import { PaginationQueryDto, PaginationMeta } from "../boards/dto/pagination.dto";
import {
  ChallengeListItemDto,
  ChallengeDetailDto,
  ChallengeCreateResponseDto,
  MyChallengeListItemDto,
} from "./dto/challenge-response.dto";

@ApiTags("challenges")
@ApiBearerAuth()
@Controller("challenges")
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @ApiOperation({ summary: "챌린지 목록 조회" })
  @ApiResponse({ status: 200, description: "챌린지 목록 반환" })
  @Get()
  async findAll(
    @Query() query: ChallengeQueryDto,
  ): Promise<{ data: ChallengeListItemDto[]; meta: PaginationMeta }> {
    const result = await this.challengesService.findAll(query);
    return {
      data: result.data.map(ChallengeListItemDto.from),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "내 챌린지 목록 조회" })
  @ApiResponse({ status: 200, description: "내 챌린지 목록 반환" })
  @Get("my")
  async findMyList(
    @CurrentUser() payload: JwtPayload,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: MyChallengeListItemDto[]; meta: PaginationMeta }> {
    const result = await this.challengesService.findMyList(payload.sub, query);
    return {
      data: result.data.map(MyChallengeListItemDto.from),
      meta: result.meta,
    };
  }

  @ApiOperation({ summary: "챌린지 상세 조회" })
  @ApiParam({ name: "id", description: "챌린지 ID" })
  @ApiResponse({ status: 200, description: "챌린지 상세 반환" })
  @ApiResponse({ status: 404, description: "챌린지를 찾을 수 없음" })
  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ChallengeDetailDto> {
    const challenge = await this.challengesService.findById(id);
    return ChallengeDetailDto.fromDetail(challenge);
  }

  @ApiOperation({ summary: "챌린지 등록 (작품 인증)" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "챌린지 등록 완료" })
  @ApiResponse({ status: 400, description: "유효하지 않은 요청" })
  @ApiResponse({ status: 404, description: "콘텐츠를 찾을 수 없음" })
  @ApiResponse({ status: 409, description: "이미 해당 콘텐츠에 대한 챌린지를 완료함" })
  @Post()
  @UseInterceptors(FileInterceptor("image"))
  async create(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateChallengeDto,
    @UploadedFile() image?: any,
  ): Promise<ChallengeCreateResponseDto> {
    // TODO: 이미지 업로드 처리 (S3 등)
    // 현재는 임시로 null 처리
    const imageUrl = image ? `https://cdn.hamddu.com/challenges/${image.filename}` : undefined;

    const { challenge } = await this.challengesService.create(
      payload.sub,
      dto,
      imageUrl,
    );

    return ChallengeDetailDto.fromDetail(challenge) as ChallengeCreateResponseDto;
  }
}
