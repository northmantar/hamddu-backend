import {
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

const FILE_UPLOAD_SCHEMA = {
  schema: {
    type: "object",
    properties: {
      file: { type: "string", format: "binary" },
    },
    required: ["file"],
  },
};

@ApiTags("media")
@ApiBearerAuth()
@Controller("media")
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({
    summary:
      "미디어 파일 업로드 (서비스용 - 프론트에서 클라이언트 압축 후 업로드)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody(FILE_UPLOAD_SCHEMA)
  @ApiResponse({ status: 201, type: MediaResponseDto })
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @CurrentUser() payload: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<MediaResponseDto> {
    const media = await this.mediaService.upload(file, payload.sub, {
      compress: false,
    });
    return MediaResponseDto.from(media);
  }

  @ApiOperation({
    summary:
      "미디어 파일 업로드 (관리자용 - 백엔드에서 압축 후 R2 업로드)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody(FILE_UPLOAD_SCHEMA)
  @ApiResponse({ status: 201, type: MediaResponseDto })
  @ApiResponse({ status: 403, description: "접근 권한 없음" })
  @Post("upload")
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @CurrentUser() payload: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<MediaResponseDto> {
    const media = await this.mediaService.upload(file, payload.sub, {
      compress: true,
    });
    return MediaResponseDto.from(media);
  }
}
