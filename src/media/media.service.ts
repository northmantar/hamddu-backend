import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Media } from "@entities/media.entity";
import { CreateMediaDto } from "./dto/create-media.dto";

@Injectable()
export class MediaService {
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
    this.cdnBase = this.config.get<string>("CDN_BASE_URL", "https://cdn.hamddu.online");

    this.s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get<string>("R2_ACCESS_KEY_ID", ""),
        secretAccessKey: this.config.get<string>("R2_SECRET_ACCESS_KEY", ""),
      },
    });
  }

  async upload(file: Express.Multer.File, uploaderId: string): Promise<Media> {
    const key = `media/${Date.now()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || undefined,
      }),
    );

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
}
