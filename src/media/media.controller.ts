import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { MediaService } from "./media.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { MediaResponseDto } from "./dto/media-response.dto";
import { CreateMediaDto } from "./dto/create-media.dto";

@ApiTags("media")
@ApiBearerAuth()
@Controller("media")
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: "미디어 생성 (서비스용 - 프론트에서 R2 업로드 후 URL 등록)" })
  @ApiResponse({ status: 201, type: MediaResponseDto })
  @Post()
  async create(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: CreateMediaDto,
  ): Promise<MediaResponseDto> {
    const media = await this.mediaService.create(dto, payload.sub);
    return MediaResponseDto.from(media);
  }

  @ApiOperation({ summary: "미디어 파일 업로드 (관리자용 - 백엔드에서 R2 업로드)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
      required: ["file"],
    },
  })
  @ApiResponse({ status: 201, type: MediaResponseDto })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Post("upload")
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @CurrentUser() payload: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<MediaResponseDto> {
    const media = await this.mediaService.upload(file, payload.sub);
    return MediaResponseDto.from(media);
  }
}
