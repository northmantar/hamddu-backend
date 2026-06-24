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

// 압축 경로 검증을 위해 sharp 를 모킹: resize/jpeg 호출만 추적하고 결정적 결과를 돌려준다.
const sharpJpeg = jest.fn().mockReturnThis();
const sharpResize = jest.fn().mockReturnThis();
const sharpRotate = jest.fn().mockReturnThis();
const sharpMetadata = jest.fn();
const sharpToBuffer = jest.fn();
jest.mock('sharp', () => {
  const ctor = jest.fn(() => ({
    rotate: sharpRotate,
    resize: sharpResize,
    jpeg: sharpJpeg,
    metadata: sharpMetadata,
    toBuffer: sharpToBuffer,
  }));
  return { __esModule: true, default: ctor };
});

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
    sharpJpeg.mockClear();
    sharpResize.mockClear();
    sharpRotate.mockClear();
    sharpMetadata.mockReset();
    sharpToBuffer.mockReset();
    sharpToBuffer.mockResolvedValue(Buffer.from('compressed'));

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

  describe('upload (compress: false)', () => {
    it('should build URL from CDN_BASE_URL config', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1', { compress: false });

      expect(configService.get).toHaveBeenCalledWith('CDN_BASE_URL');
    });

    it('should generate an ASCII object key without the original filename', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(
        { ...mockFile, originalname: '뜨개 사진.jpg' } as Express.Multer.File,
        'user-1',
        { compress: false },
      );

      const createCall = mediaRepo.create.mock.calls[0][0] as Partial<Media>;
      expect(createCall.url).not.toContain('뜨개 사진');
      expect(createCall.url).toMatch(
        /^https:\/\/cdn\.hamddu\.online\/media\/\d+-[a-f0-9]{32}\.jpg$/,
      );
    });

    it('should set uploaderId from the caller', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-42', { compress: false });

      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ uploaderId: 'user-42' }),
      );
    });

    it('should set mimeType from file', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1', { compress: false });

      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'image/jpeg' }),
      );
    });

    it('should use the configured CDN base URL as the URL prefix', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1', { compress: false });

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

      await blankCdnService.upload(mockFile, 'user-1', { compress: false });

      const createCall = blankCdnRepo.create.mock.calls[0][0] as Partial<Media>;
      expect(createCall.url).toMatch(/^https:\/\/cdn\.hamddu\.online\/media\//);
    });

    it('should save and return the media entity', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      const result = await service.upload(mockFile, 'user-1', { compress: false });

      expect(mediaRepo.save).toHaveBeenCalledWith(mockMedia);
      expect(result).toEqual(mockMedia);
    });

    it('should set mimeType to null when file has no mimetype', async () => {
      const fileWithoutMime = { ...mockFile, mimetype: '' };
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(fileWithoutMime as Express.Multer.File, 'user-1', { compress: false });

      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: null }),
      );
    });

    it('should upload original buffer to R2 (no compression)', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1', { compress: false });

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ Bucket: 'test-bucket', Body: mockFile.buffer }),
      );
      expect(sharpResize).not.toHaveBeenCalled();
      expect(sharpJpeg).not.toHaveBeenCalled();
    });

    it('should use the generated ASCII object key when uploading to S3', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(
        { ...mockFile, originalname: '한글 파일명.png' } as Express.Multer.File,
        'user-1',
        { compress: false },
      );

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
        { compress: false },
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

      await service.upload(mockFile, 'user-1', { compress: false });

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentLength: mockFile.size }),
      );
    });

    it('should send the upload request with an abort signal', async () => {
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1', { compress: false });

      expect(mockS3Send).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ abortSignal: expect.any(AbortSignal) }),
      );
    });

    it('should use file mimetype as ContentType when uploading to S3', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1', { compress: false });

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

      await expect(service.upload(mockFile, 'user-1', { compress: false })).rejects.toThrow(
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

      await expect(service.upload(mockFile, 'user-1', { compress: false })).rejects.toThrow(
        'R2 업로드 요청이 시간 초과되었습니다.',
      );
    });
  });

  describe('upload (compress: true)', () => {
    it('should resize when the longer side exceeds the max dimension and re-encode as JPEG q75', async () => {
      sharpMetadata.mockResolvedValue({ width: 4000, height: 3000 });
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1', { compress: true });

      // 가로가 더 길면 width: 1200 로 리사이즈
      expect(sharpResize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1200, withoutEnlargement: true }),
      );
      expect(sharpJpeg).toHaveBeenCalledWith({ quality: 75 });
    });

    it('should skip resize when image already fits within max dimension', async () => {
      sharpMetadata.mockResolvedValue({ width: 800, height: 600 });
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(mockFile, 'user-1', { compress: true });

      expect(sharpResize).not.toHaveBeenCalled();
      expect(sharpJpeg).toHaveBeenCalledWith({ quality: 75 });
    });

    it('should store compressed buffer as image/jpeg regardless of input mimetype', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      sharpMetadata.mockResolvedValue({ width: 500, height: 500 });
      const pngFile = { ...mockFile, originalname: 'pic.png', mimetype: 'image/png' };
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.upload(pngFile as Express.Multer.File, 'user-1', { compress: true });

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'image/jpeg' }),
      );
      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'image/jpeg' }),
      );
      const createCall = mediaRepo.create.mock.calls[0][0] as Partial<Media>;
      expect(createCall.url).toMatch(/\.jpg$/);
    });
  });

  describe('upload (no file)', () => {
    it('should throw 400 when file is missing', async () => {
      await expect(
        service.upload(undefined as unknown as Express.Multer.File, 'user-1', { compress: false }),
      ).rejects.toThrow('파일이 필요합니다.');
    });
  });
});
