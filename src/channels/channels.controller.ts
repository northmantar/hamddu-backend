import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ChannelsService } from "./channels.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { ChannelResponseDto } from "./dto/channel-response.dto";

@ApiTags("channels")
@ApiBearerAuth()
@Controller("channels")
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @ApiOperation({ summary: "채널 목록 조회" })
  @ApiResponse({ status: 200, description: "채널 목록 반환" })
  @Get()
  async findAll(): Promise<{ data: ChannelResponseDto[] }> {
    const channels = await this.channelsService.findAll();
    return { data: channels.map(ChannelResponseDto.from) };
  }

  @ApiOperation({ summary: "채널 등록 (관리자)" })
  @ApiResponse({ status: 201, description: "채널 등록 완료" })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @ApiResponse({ status: 409, description: "이미 등록된 채널" })
  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() dto: CreateChannelDto): Promise<ChannelResponseDto> {
    const channel = await this.channelsService.create(dto);
    return ChannelResponseDto.from(channel);
  }
}
