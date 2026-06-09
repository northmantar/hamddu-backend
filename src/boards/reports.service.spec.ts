import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { BoardReport } from '@entities/board-report.entity';
import { Board } from '@entities/board.entity';
import { User } from '@entities/user.entity';
import { ReportReason, ReportStatus } from '@enums/report.enum';
import { UserType } from '@enums/user.enum';
import { BoardStatus } from '@enums/board.enum';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepo: jest.Mocked<Repository<BoardReport>>;
  let boardRepo: jest.Mocked<Repository<Board>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockBoard: Partial<Board> = {
    id: 'board-123',
    memberId: 'author-123',
    title: 'Test Board',
    body: 'Test Content',
    status: BoardStatus.PUBLISHED,
    isHidden: false,
  };

  const mockReport: Partial<BoardReport> = {
    id: 'report-123',
    boardId: 'board-123',
    reporterId: 'reporter-123',
    reason: ReportReason.SPAM,
    description: '스팸 게시글입니다.',
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

    const mockBoardRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(BoardReport), useValue: mockReportRepo },
        { provide: getRepositoryToken(Board), useValue: mockBoardRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepo = module.get(getRepositoryToken(BoardReport));
    boardRepo = module.get(getRepositoryToken(Board));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report successfully', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      reportRepo.findOne.mockResolvedValue(null);
      reportRepo.create.mockReturnValue(mockReport as BoardReport);
      reportRepo.save.mockResolvedValue(mockReport as BoardReport);

      const result = await service.create('board-123', 'reporter-123', {
        reason: ReportReason.SPAM,
        description: '스팸 게시글입니다.',
      });

      expect(result).toEqual(mockReport);
      expect(reportRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if board not found', async () => {
      boardRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('non-existent', 'reporter-123', {
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if reporting own board', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);

      await expect(
        service.create('board-123', 'author-123', {
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if already reported', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      reportRepo.findOne.mockResolvedValue(mockReport as BoardReport);

      await expect(
        service.create('board-123', 'reporter-123', {
          reason: ReportReason.SPAM,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return report if found', async () => {
      reportRepo.findOne.mockResolvedValue(mockReport as BoardReport);

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

  describe('findByBoardId', () => {
    it('should return reports for specific board', async () => {
      const result = await service.findByBoardId('board-123', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder([mockReport], 1);
      reportRepo.createQueryBuilder.mockReturnValue(qb as any);

      await service.findByBoardId('board-123', { page: 1, limit: 20, status: ReportStatus.PENDING });

      expect(qb.andWhere).toHaveBeenCalledWith('report.status = :status', { status: ReportStatus.PENDING });
    });
  });

  describe('update', () => {
    it('should resolve report and hide board', async () => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      reportRepo.findOne.mockResolvedValue(mockReport as BoardReport);

      await service.update('report-123', 'admin-123', { status: ReportStatus.RESOLVED });

      expect(boardRepo.update).toHaveBeenCalledWith('board-123', { isHidden: true });
      expect(reportRepo.update).toHaveBeenCalledWith('report-123', expect.objectContaining({
        status: ReportStatus.RESOLVED,
      }));
    });

    it('should reject report without hiding board', async () => {
      userRepo.findOne.mockResolvedValue(mockAdmin as User);
      reportRepo.findOne.mockResolvedValue(mockReport as BoardReport);

      await service.update('report-123', 'admin-123', { status: ReportStatus.REJECTED });

      expect(boardRepo.update).not.toHaveBeenCalled();
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
      } as BoardReport);

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
