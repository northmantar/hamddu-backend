import { Controller, Get, Query, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { NicknamesService } from "./nicknames.service";
import { RegisterNicknameDto } from "@dto/register-nickname.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";

@ApiTags('nicknames')
@ApiBearerAuth()
@Controller("nicknames")
@UseGuards(JwtAuthGuard)
export class NicknamesController {
  constructor(private readonly nicknamesService: NicknamesService) {}

  @ApiOperation({ summary: '닉네임 중복 확인' })
  @ApiQuery({ name: 'value', description: '확인할 닉네임' })
  @ApiResponse({ status: 200, schema: { example: { isTaken: false } } })
  @Get("check")
  async check(@Query("value") value: string) {
    const isTaken = await this.nicknamesService.check(value);
    return { isTaken };
  }

  @ApiOperation({ summary: '닉네임 후보 목록 조회 (시퀀스 소비 없음)' })
  @ApiQuery({ name: 'count', required: false, description: '반환할 후보 수 (최대 20, 기본값 10)', example: 10 })
  @ApiResponse({ status: 200, schema: { example: ['포근한 실뭉치', '따뜻한 바늘'] } })
  @Get("candidates")
  async candidates(@Query("count") count = "10") {
    return this.nicknamesService.getCandidates(Math.min(Number(count), 20));
  }

  @ApiOperation({ summary: '랜덤 닉네임 추천 (점유하지 않고 후보만 반환)' })
  @ApiResponse({ status: 200, schema: { example: { nickname: '포근한 실뭉치' } } })
  @Post("issue")
  async issue() {
    const nickname = await this.nicknamesService.issueNickname();
    return { nickname };
  }

  @ApiOperation({ summary: '닉네임 직접 등록 (인증 유저가 입력한 닉네임 점유, 중복 시 접미사 부여)' })
  @ApiResponse({ status: 200, schema: { example: { nickname: '실뭉치장인' } } })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @Post("register")
  async register(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: RegisterNicknameDto,
  ) {
    const nickname = await this.nicknamesService.registerNickname(
      payload.sub,
      dto.nickname,
    );
    return { nickname };
  }
}
