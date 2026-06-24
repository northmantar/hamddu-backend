import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { extname } from "path";
// sharp 는 CommonJS 모듈(`module.exports = sharp`)이라 default import가 런타임에서 undefined 가
// 된다(tsconfig 에 esModuleInterop 가 꺼져 있을 때). CJS require 형식으로 직접 가져와 callable
// 함수로 사용한다.
import sharp = require("sharp");
import { Media } from "@entities/media.entity";

// 프론트(expo-image-manipulator)와 동일한 정책: 긴 변 ≤ 1200px, JPEG 품질 75.
const COMPRESS_MAX_DIMENSION = 1200;
const COMPRESS_JPEG_QUALITY = 75;
const COMPRESSED_MIME = "image/jpeg";
const COMPRESSED_EXT = "jpg";

export interface UploadOptions {
  compress: boolean;
}

// upload 파이프라인에서 사용하는 정규화된 파일 표현. 압축/비압축 어느 경로든 동일한 형태로 다룬다.
interface ProcessedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private static readonly R2_UPLOAD_TIMEOUT_MS = 30_000;
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cdnBase: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly config: ConfigService,
  ) {
    const accountId = this.config.get<string>("R2_ACCOUNT_ID", "");
    this.bucket = this.config.get<string>("R2_BUCKET_NAME", "hamddu-media");
    this.cdnBase = this.config.get<string>("CDN_BASE_URL") || "https://cdn.hamddu.online";
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID", "");
    const secretAccessKey =
      this.config.get<string>("R2_SECRET_ACCESS_KEY") ||
      this.config.get<string>("R2_ACCESS_KEY") ||
      "";

    this.assertR2Config(accountId, accessKeyId, secretAccessKey);

    this.s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(
    file: Express.Multer.File,
    uploaderId: string,
    options: UploadOptions,
  ): Promise<Media> {
    if (!file) {
      throw new BadRequestException("파일이 필요합니다.");
    }

    const processed: ProcessedFile = options.compress
      ? await this.compress(file)
      : {
          buffer: file.buffer,
          mimetype: file.mimetype || "",
          originalname: file.originalname,
          size: file.size,
        };

    const key = this.createObjectKey(processed);
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      MediaService.R2_UPLOAD_TIMEOUT_MS,
    );

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: processed.buffer,
          ContentType: processed.mimetype || undefined,
          ContentLength: processed.size,
        }),
        { abortSignal: abortController.signal },
      );
    } catch (error) {
      this.handleR2Error(error, key);
    } finally {
      clearTimeout(timeout);
    }

    const media = this.mediaRepo.create({
      uploaderId,
      url: `${this.cdnBase}/${key}`,
      mimeType: processed.mimetype || null,
    });
    return this.mediaRepo.save(media);
  }

  // 프론트의 expo-image-manipulator 압축과 동일한 정책으로 이미지를 리사이즈/재인코딩한다.
  private async compress(file: Express.Multer.File): Promise<ProcessedFile> {
    // sharp 는 CJS export 라 타입상 callable 로 인식되지 않으므로 호출부에서 캐스트한다.
    let pipeline = (sharp as unknown as (input: Buffer) => sharp.Sharp)(file.buffer).rotate(); // EXIF orientation 보정
    const { width, height } = await pipeline.metadata();

    if (
      (width ?? 0) > COMPRESS_MAX_DIMENSION ||
      (height ?? 0) > COMPRESS_MAX_DIMENSION
    ) {
      const resizeOptions =
        (width ?? 0) >= (height ?? 0)
          ? { width: COMPRESS_MAX_DIMENSION }
          : { height: COMPRESS_MAX_DIMENSION };
      pipeline = pipeline.resize({ ...resizeOptions, withoutEnlargement: true });
    }

    const buffer = await pipeline
      .jpeg({ quality: COMPRESS_JPEG_QUALITY })
      .toBuffer();

    const baseName = file.originalname?.replace(/\.[^.]+$/, "") ?? "image";
    return {
      buffer,
      mimetype: COMPRESSED_MIME,
      originalname: `${baseName}.${COMPRESSED_EXT}`,
      size: buffer.length,
    };
  }

  private assertR2Config(accountId: string, accessKeyId: string, secretAccessKey: string): void {
    const missing = [
      ["R2_ACCOUNT_ID", accountId],
      ["R2_BUCKET_NAME", this.bucket],
      ["R2_ACCESS_KEY_ID", accessKeyId],
      ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new InternalServerErrorException(`R2 설정이 누락되었습니다: ${missing.join(", ")}`);
    }
  }

  private handleR2Error(error: unknown, key: string): never {
    const err = error as { name?: string; message?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
    const code = err.name || err.Code || "UnknownS3Error";
    const status = err.$metadata?.httpStatusCode;

    this.logger.error(
      `R2 upload failed: code=${code}, status=${status ?? "unknown"}, bucket=${this.bucket}, key=${key}`,
      err.message,
    );

    if (code === "AccessDenied" || status === 403) {
      throw new BadGatewayException(
        "R2 업로드 권한이 거부되었습니다. R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY, 버킷 이름, 토큰의 Object Read & Write 권한을 확인해주세요.",
      );
    }

    if (code === "AbortError") {
      throw new GatewayTimeoutException(
        "R2 업로드 요청이 시간 초과되었습니다. 서버 outbound IP가 R2 Client IP Address Filtering에 포함되어 있는지 확인해주세요.",
      );
    }

    throw new BadGatewayException("R2 업로드에 실패했습니다.");
  }

  private createObjectKey(file: ProcessedFile): string {
    const id = randomUUID().replace(/-/g, "");
    const extension = this.getSafeExtension(file);

    return `media/${Date.now()}-${id}${extension}`;
  }

  private getSafeExtension(file: ProcessedFile): string {
    const originalExtension = extname(file.originalname || "")
      .toLowerCase()
      .replace(/^\./, "");

    if (/^[a-z0-9]{1,10}$/.test(originalExtension)) {
      return `.${originalExtension}`;
    }

    const mimeExtensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/svg+xml": ".svg",
      "image/avif": ".avif",
    };

    return mimeExtensions[file.mimetype] ?? "";
  }
}
