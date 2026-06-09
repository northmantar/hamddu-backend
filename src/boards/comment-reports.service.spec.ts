import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommentReportsService } from './comment-reports.service';
import { CommentReport } from '@entities/comment-report.entity';
import { BoardComment } from '@entities/board-comment.entity';
import { User } from '@entities/user.entity';
import { ReportReason, ReportStatus } from '@enums/report.enum';
import { UserType } from '@enums/user.enum';

describe('CommentReportsService', () => {
  let service: CommentReportsService;
  let reportRepo: jest.Mocked<Repository<CommentReport>>;
  let commentRepo: jest.Mocked<Repository<BoardComment>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockComment: Partial<BoardComment> = {
    id: 'comment-123',
    boardId: 'board-123',
    memberId: 'author-123',
    body: 'Test Comment',
    depth: 0,
    parentId: null,
    likeCount: 0,
    isHidden: false,
  };

  const mockReport: Partial<CommentReport> = {
    id: 'report-123',
    commentId: 'comment-123',
    reporterId: 'reporter-123',
    reason: ReportReason.HARASSMENT,
    description: '욕설이 포함되어 있습니다.',
    status: ReportStatus.PENDING,
    createdAt: new Date('2026-04-09T12:00:00.000Z'),
    processedAt: null,
  };

  const mockReporter: Partial<User> = {
    id: 'reporter-123',
    nickname: '신고자',
    type: UserType.MEMBER,
  };

  const mockAdmin: Partial<User> = {
    id: 'admin-123',
    nickname: '관리자',
    type: UserType.ADMIN,
  };

  const createMockQueryBuilder = (data: any[], totalCount: number) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([data, totalCount]),
  });

  beforeEach(async () => {
    const mockReportRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(() => createMockQueryBuilder([mockReport], 1)),
    };

    const mockCommentRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentReportsService,
        { provide: getRepositoryToken(CommentReport), useValue: mockReportRepo },
        { provide: getRepositoryToken(BoardComment), useValue: mockCommentRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<CommentReportsService>(CommentReportsService);
    reportRepo = module.get(getRepositoryToken(CommentReport));
    commentRepo = module.get(getRepositoryToken(BoardComment));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report successfully', async () => {
      commentRepo.findOne.mockResolvedValue(mockComment as BoardComment);
      reportRepo.findOne.mockResolvedValue(null);
      reportRepo.create.mockReturnValue(mockReport as CommentReport);
      reportRepo.save.mockResolvedValue(mockReport as CommentReport);

      const result = await service.create('comment-123', 'reporter-123', {
        reason: ReportReason.HARASSMENT,
        description: '욕설이 포함되어 있습니다.',
      });

      expect(result).toEqual(mockReport);
      expect(reportRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment not found', async () => {
      commentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('non-existent', 'reporter-123', {
          reason: ReportReason.HARASSMENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if reporting own comment', async () => {
      commentRepo.findOne.mockResolvedValue(mockComment as BoardComment);

      await expect(
        service.create('comment-123', 'author-123', {
          reason: ReportReason.HARASSMENT,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if already reported', async () => {
      commentRepo.findOne.mockResolvedValue(mockComment as BoardComment);
      reportRepo.findOne.mockResolvedValue(mockReport as CommentReport);

      await expect(
        service.create('comment-123', 'reporter-123', {
          reason: ReportReason.HARASSMENT,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return report if found', async () => {
      reportRepo.findOne.mockResolvedValue(mockReport as CommentReport);

      const result = await service.findById('report-123');

      expect(result).toEqual(mockReport);
    });

    it('should throw NotFoundException if report not found', async () => {
      reportRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated reports', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalCount).toBe(1);
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder([mockReport], 1);
      reportRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.findAll({ page: 1, limit: 20, status: ReportStatus.PENDING });

      expect(qb.where).toHaveBeenCalledWith('report.status = :status', { status: ReportStatus.PENDING });
    });
  });

  describe('findByCommentId', () => {
    it('should return reports for specific comment', async () => {
      const result = await service.findByCommentId('comment-123', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder([mockReport], 1);
      reportRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.findByCommentId('comment-123', { page: 1, limit: 20, status: ReportStatus.PENDING });

      expect(qb.andWhere).toHaveBeenCalledWith('report.status = :status', { status: ReportStatus.PENDING });
    });
  });

  describe('update', () => {
    it('should resolve report and hide comment', async () => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      reportRepo.findOne.mockResolvedValue(mockReport as CommentReport);

      await service.update('report-123', 'admin-123', { status: ReportStatus.RESOLVED });

      expect(commentRepo.update).toHaveBeenCalledWith('comment-123', { isHidden: true });
      expect(reportRepo.update).toHaveBeenCalledWith('report-123', expect.objectContaining({
        status: ReportStatus.RESOLVED,
      }));
    });

    it('should reject report without hiding comment', async () => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      reportRepo.findOne.mockResolvedValue(mockReport as CommentReport);

      await service.update('report-123', 'admin-123', { status: ReportStatus.REJECTED });

      expect(commentRepo.update).not.toHaveBeenCalled();
      expect(reportRepo.update).toHaveBeenCalledWith('report-123', expect.objectContaining({
        status: ReportStatus.REJECTED,
      }));
    });

    it('should throw ForbiddenException for non-admin', async () => {
      userRepo.findOne.mockResolvedValue(mockReporter as User);

      await expect(
        service.update('report-123', 'reporter-123', { status: ReportStatus.RESOLVED }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if already processed', async () => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      reportRepo.findOne.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
      } as CommentReport);

      await expect(
        service.update('report-123', 'admin-123', { status: ReportStatus.RESOLVED }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if report not found', async () => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      reportRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'admin-123', { status: ReportStatus.RESOLVED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
