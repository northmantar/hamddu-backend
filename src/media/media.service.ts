import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Media } from "@entities/media.entity";

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly config: ConfigService,
  ) {}

  async upload(file: Express.Multer.File, uploaderId: string): Promise<Media> {
    const cdnBase = this.config.get<string>("CDN_BASE_URL", "https://cdn.hamddu.online");
    const url = `${cdnBase}/media/${Date.now()}-${file.originalname}`;

    const media = this.mediaRepo.create({
      uploaderId,
      url,
      mimeType: file.mimetype || null,
    });

    return this.mediaRepo.save(media);
  }
}
