import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { Media } from '@entities/media.entity';

const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => input),
}));

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: jest.Mocked<Repository<Media>>;
  let configService: jest.Mocked<ConfigService>;
  let configValues: Record<string, string>;

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
    mockS3Send.mockReset();
    mockS3Send.mockResolvedValue({});
    configValues = {
      CDN_BASE_URL: 'https://cdn.hamddu.online',
      R2_ACCOUNT_ID: 'test-account-id',
      R2_BUCKET_NAME: 'test-bucket',
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
    };

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
              return configValues[key] ?? fallback;
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

      expect(configService.get).toHaveBeenCalledWith('CDN_BASE_URL');
    });

    it('should generate an ASCII object key without the original filename', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload({ ...mockFile, originalname: '뜨개 사진.jpg' } as Express.Multer.File, 'user-1');

      const createCall = mediaRepo.create.mock.calls[0][0] as Partial<Media>;
      expect(createCall.url).not.toContain('뜨개 사진');
      expect(createCall.url).toMatch(
        /^https:\/\/cdn\.hamddu\.online\/media\/\d+-[a-f0-9]{32}\.jpg$/,
      );
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

    it('should fall back to the default CDN base URL when CDN_BASE_URL is blank', async () => {
      const blankCdnRepo = {
        create: jest.fn().mockReturnValue(mockMedia),
        save: jest.fn().mockResolvedValue(mockMedia),
      };
      const module = await Test.createTestingModule({
        providers: [
          MediaService,
          {
            provide: getRepositoryToken(Media),
            useValue: blankCdnRepo,
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, fallback?: string) => {
                const values: Record<string, string> = {
                  CDN_BASE_URL: '',
                  R2_ACCOUNT_ID: 'test-account-id',
                  R2_BUCKET_NAME: 'test-bucket',
                  R2_ACCESS_KEY_ID: 'test-access-key',
                  R2_SECRET_ACCESS_KEY: 'test-secret-key',
                };

                return values[key] ?? fallback;
              }),
            },
          },
        ],
      }).compile();
      const blankCdnService = module.get(MediaService);

      await blankCdnService.upload(mockFile, 'user-1');

      const createCall = blankCdnRepo.create.mock.calls[0][0] as Partial<Media>;
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

    it('should use the generated ASCII object key when uploading to S3', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload({ ...mockFile, originalname: '한글 파일명.png' } as Express.Multer.File, 'user-1');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringMatching(/^media\/\d+-[a-f0-9]{32}\.png$/),
        }),
      );
    });

    it('should fall back to mimetype extension when original extension is unsafe', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(
        { ...mockFile, originalname: '이미지.사진', mimetype: 'image/webp' } as Express.Multer.File,
        'user-1',
      );

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringMatching(/^media\/\d+-[a-f0-9]{32}\.webp$/),
        }),
      );
    });

    it('should include content length when uploading to S3', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentLength: mockFile.size }),
      );
    });

    it('should send the upload request with an abort signal', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1');

      expect(mockS3Send).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ abortSignal: expect.any(AbortSignal) }),
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

    it('should configure the S3 client for Cloudflare R2', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');

      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'auto',
          endpoint: 'https://test-account-id.r2.cloudflarestorage.com',
          forcePathStyle: true,
          requestChecksumCalculation: 'WHEN_REQUIRED',
          credentials: {
            accessKeyId: 'test-access-key',
            secretAccessKey: 'test-secret-key',
          },
        }),
      );
    });

    it('should surface R2 AccessDenied as a gateway error', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);
      mockS3Send.mockRejectedValueOnce({
        name: 'AccessDenied',
        message: 'Access Denied',
        $metadata: { httpStatusCode: 403 },
      });

      await expect(service.upload(mockFile, 'user-1')).rejects.toThrow(
        'R2 업로드 권한이 거부되었습니다.',
      );
    });

    it('should surface R2 timeout as a gateway timeout error', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);
      mockS3Send.mockRejectedValueOnce({
        name: 'AbortError',
        message: 'The operation was aborted',
      });

      await expect(service.upload(mockFile, 'user-1')).rejects.toThrow(
        'R2 업로드 요청이 시간 초과되었습니다.',
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
