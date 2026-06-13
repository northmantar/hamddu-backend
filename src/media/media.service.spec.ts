import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { Media } from '@entities/media.entity';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => input),
}));

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: jest.Mocked<Repository<Media>>;
  let configService: jest.Mocked<ConfigService>;

  const mockFile = {
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image'),
    size: 1024,
  } as Express.Multer.File;

  const mockMedia: Media = {
    id: 'media-1',
    uploaderId: 'user-1',
    uploader: null,
    url: 'https://cdn.hamddu.online/media/123-photo.jpg',
    mimeType: 'image/jpeg',
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(Media),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              if (key === 'CDN_BASE_URL') return 'https://cdn.hamddu.online';
              if (key === 'R2_ACCOUNT_ID') return 'test-account-id';
              if (key === 'R2_BUCKET_NAME') return 'test-bucket';
              if (key === 'R2_ACCESS_KEY_ID') return 'test-access-key';
              if (key === 'R2_SECRET_ACCESS_KEY') return 'test-secret-key';
              return fallback;
            }),
          },
        },
      ],
    }).compile();

    service       = module.get(MediaService);
    mediaRepo     = module.get(getRepositoryToken(Media));
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should build URL from CDN_BASE_URL config', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1');

      expect(configService.get).toHaveBeenCalledWith('CDN_BASE_URL', 'https://cdn.hamddu.online');
    });

    it('should include original filename in generated URL', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1');

      const createCall = mediaRepo.create.mock.calls[0][0] as Partial<Media>;
      expect(createCall.url).toContain('photo.jpg');
      expect(createCall.url).toMatch(/^https:\/\/cdn\.hamddu\.online\/media\//);
    });

    it('should set uploaderId from the caller', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-42');

      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ uploaderId: 'user-42' }),
      );
    });

    it('should set mimeType from file', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1');

      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'image/jpeg' }),
      );
    });

    it('should use the configured CDN base URL as the URL prefix', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1');

      const createCall = mediaRepo.create.mock.calls[0][0] as Partial<Media>;
      expect(createCall.url).toMatch(/^https:\/\/cdn\.hamddu\.online\/media\//);
    });

    it('should save and return the media entity', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      const result = await service.upload(mockFile, 'user-1');

      expect(mediaRepo.save).toHaveBeenCalledWith(mockMedia);
      expect(result).toEqual(mockMedia);
    });

    it('should set mimeType to null when file has no mimetype', async () => {
      const fileWithoutMime = { ...mockFile, mimetype: '' };
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(fileWithoutMime as Express.Multer.File, 'user-1');

      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: null }),
      );
    });

    it('should use R2_BUCKET_NAME when uploading to S3', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: 'test-bucket', Body: mockFile.buffer }),
      );
    });

    it('should use file mimetype as ContentType when uploading to S3', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'image/jpeg' }),
      );
    });
  });

  describe('create', () => {
    const createDto = {
      url: 'https://cdn.hamddu.online/media/abc123.jpg',
      mimeType: 'image/jpeg',
    };

    it('should create media with provided URL and mimeType', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.create(createDto, 'user-1');

      expect(mediaRepo.create).toHaveBeenCalledWith({
        uploaderId: 'user-1',
        url: createDto.url,
        mimeType: createDto.mimeType,
      });
    });

    it('should set mimeType to null when not provided', async () => {
      const dtoWithoutMimeType = { url: 'https://cdn.hamddu.online/media/abc123.jpg' };
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.create(dtoWithoutMimeType, 'user-1');

      expect(mediaRepo.create).toHaveBeenCalledWith({
        uploaderId: 'user-1',
        url: dtoWithoutMimeType.url,
        mimeType: null,
      });
    });

    it('should save and return the media entity', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      const result = await service.create(createDto, 'user-1');

      expect(mediaRepo.save).toHaveBeenCalledWith(mockMedia);
      expect(result).toEqual(mockMedia);
    });
  });
});
