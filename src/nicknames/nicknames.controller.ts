import { Controller, Get, Query, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { NicknamesService } from "./nicknames.service";
import { RegisterNicknameDto } from "@dto/register-nickname.dto";

@ApiTags('nicknames')
@Controller("nicknames")
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

  @ApiOperation({ summary: '닉네임 자동 발급 (서버가 생성하여 즉시 등록)' })
  @ApiResponse({ status: 200, schema: { example: { nickname: '포근한 실뭉치' } } })
  @Post("issue")
  async issue() {
    return this.nicknamesService.issueNickname();
  }

  @ApiOperation({ summary: '닉네임 직접 등록 (중복 시 접미사 부여)' })
  @ApiResponse({ status: 200, schema: { example: { nickname: '실뭉치장인' } } })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @Post("register")
  async register(@Body() dto: RegisterNicknameDto) {}
}
