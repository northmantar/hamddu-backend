import {
  BadGatewayException,
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
import { Media } from "@entities/media.entity";
import { CreateMediaDto } from "./dto/create-media.dto";

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

  async upload(file: Express.Multer.File, uploaderId: string): Promise<Media> {
    const key = this.createObjectKey(file);
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), MediaService.R2_UPLOAD_TIMEOUT_MS);

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || undefined,
          ContentLength: file.size,
        }),
        { abortSignal: abortController.signal },
      );
    } catch (error) {
      this.handleR2Error(error, key);
    } finally {
      clearTimeout(timeout);
    }

    const url = `${this.cdnBase}/${key}`;
    const media = this.mediaRepo.create({
      uploaderId,
      url,
      mimeType: file.mimetype || null,
    });

    return this.mediaRepo.save(media);
  }

  async create(dto: CreateMediaDto, uploaderId: string): Promise<Media> {
    const media = this.mediaRepo.create({
      uploaderId,
      url: dto.url,
      mimeType: dto.mimeType || null,
    });

    return this.mediaRepo.save(media);
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

  private createObjectKey(file: Express.Multer.File): string {
    const id = randomUUID().replace(/-/g, "");
    const extension = this.getSafeExtension(file);

    return `media/${Date.now()}-${id}${extension}`;
  }

  private getSafeExtension(file: Express.Multer.File): string {
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
