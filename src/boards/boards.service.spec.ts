import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Board } from '@entities/board.entity';
import { BoardLike } from '@entities/board-like.entity';
import { BoardCategory } from '@entities/board-category.entity';
import { User } from '@entities/user.entity';
import { BoardStatus, BoardCategoryStatus } from '@enums/board.enum';
import { UserType } from '@enums/user.enum';

describe('BoardsService', () => {
  let service: BoardsService;
  let boardRepo: jest.Mocked<Repository<Board>>;
  let boardLikeRepo: jest.Mocked<Repository<BoardLike>>;
  let categoryRepo: jest.Mocked<Repository<BoardCategory>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockCategory: Partial<BoardCategory> = {
    id: 'cat-123',
    label: '자유게시판',
    status: BoardCategoryStatus.ENABLED,
  };

  const mockBoard: Partial<Board> = {
    id: 'board-123',
    memberId: 'user-123',
    categoryId: 'cat-123',
    title: 'Test Board',
    body: 'Test Content',
    status: BoardStatus.PUBLISHED,
    likeCount: 0,
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    type: UserType.MEMBER,
  };

  beforeEach(async () => {
    const mockBoardRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBoard], 1]),
      })),
    };

    const mockBoardLikeRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsBy: jest.fn(),
    };

    const mockCategoryRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: getRepositoryToken(Board), useValue: mockBoardRepo },
        { provide: getRepositoryToken(BoardLike), useValue: mockBoardLikeRepo },
        { provide: getRepositoryToken(BoardCategory), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
    boardRepo = module.get(getRepositoryToken(Board));
    boardLikeRepo = module.get(getRepositoryToken(BoardLike));
    categoryRepo = module.get(getRepositoryToken(BoardCategory));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated boards', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalCount).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return board if found', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);

      const result = await service.findById('board-123');

      expect(result).toEqual(mockBoard);
    });

    it('should throw NotFoundException if board not found', async () => {
      boardRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a board successfully', async () => {
      categoryRepo.findOne.mockResolvedValue(mockCategory as BoardCategory);
      boardRepo.create.mockReturnValue(mockBoard as Board);
      boardRepo.save.mockResolvedValue(mockBoard as Board);
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);

      const result = await service.create('user-123', {
        categoryId: 'cat-123',
        title: 'Test Board',
        body: 'Test Content',
      });

      expect(result).toEqual(mockBoard);
    });

    it('should throw BadRequestException for invalid category', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('user-123', {
          categoryId: 'invalid-cat',
          title: 'Test',
          body: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update board by owner', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      userRepo.findOne.mockResolvedValue(mockUser as User);

      await service.update('board-123', 'user-123', { title: 'Updated Title' });

      expect(boardRepo.update).toHaveBeenCalled();
    });

    it('should allow admin to update any board', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      userRepo.findOne.mockResolvedValue({ ...mockUser, id: 'admin-123', type: UserType.ADMIN } as User);

      await service.update('board-123', 'admin-123', { title: 'Updated Title' });

      expect(boardRepo.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-owner', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      userRepo.findOne.mockResolvedValue({ ...mockUser, id: 'other-user' } as User);

      await expect(
        service.update('board-123', 'other-user', { title: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should soft delete board by owner', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      userRepo.findOne.mockResolvedValue(mockUser as User);

      await service.delete('board-123', 'user-123');

      expect(boardRepo.update).toHaveBeenCalledWith('board-123', expect.objectContaining({
        status: BoardStatus.DELETED,
      }));
    });

    it('should throw ForbiddenException for non-owner', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      userRepo.findOne.mockResolvedValue({ ...mockUser, id: 'other-user' } as User);

      await expect(service.delete('board-123', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('like', () => {
    it('should add like successfully', async () => {
      boardRepo.findOne
        .mockResolvedValueOnce(mockBoard as Board)
        .mockResolvedValueOnce({ ...mockBoard, likeCount: 1 } as Board);
      boardLikeRepo.findOne.mockResolvedValue(null);

      const result = await service.like('board-123', 'user-456');

      expect(boardLikeRepo.save).toHaveBeenCalled();
      expect(boardRepo.increment).toHaveBeenCalled();
      expect(result.likeCount).toBe(1);
    });

    it('should throw ConflictException if already liked', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      boardLikeRepo.findOne.mockResolvedValue({ boardId: 'board-123', memberId: 'user-123' } as BoardLike);

      await expect(service.like('board-123', 'user-123')).rejects.toThrow(ConflictException);
    });
  });

  describe('unlike', () => {
    it('should remove like successfully', async () => {
      boardRepo.findOne
        .mockResolvedValueOnce(mockBoard as Board)
        .mockResolvedValueOnce({ ...mockBoard, likeCount: 0 } as Board);
      boardLikeRepo.findOne.mockResolvedValue({ boardId: 'board-123', memberId: 'user-123' } as BoardLike);

      const result = await service.unlike('board-123', 'user-123');

      expect(boardLikeRepo.delete).toHaveBeenCalled();
      expect(boardRepo.decrement).toHaveBeenCalled();
      expect(result.likeCount).toBe(0);
    });

    it('should throw NotFoundException if not liked', async () => {
      boardRepo.findOne.mockResolvedValue(mockBoard as Board);
      boardLikeRepo.findOne.mockResolvedValue(null);

      await expect(service.unlike('board-123', 'user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Category CRUD', () => {
    describe('findAllCategories', () => {
      it('should return enabled categories', async () => {
        categoryRepo.find.mockResolvedValue([mockCategory as BoardCategory]);

        const result = await service.findAllCategories();

        expect(result).toHaveLength(1);
        expect(categoryRepo.find).toHaveBeenCalledWith({
          where: { status: BoardCategoryStatus.ENABLED },
          order: { createdAt: 'ASC' },
        });
      });
    });

    describe('createCategory', () => {
      it('should create category successfully', async () => {
        categoryRepo.create.mockReturnValue(mockCategory as BoardCategory);
        categoryRepo.save.mockResolvedValue(mockCategory as BoardCategory);

        const result = await service.createCategory({ label: '자유게시판' });

        expect(result.label).toBe('자유게시판');
      });
    });

    describe('updateCategory', () => {
      it('should update category successfully', async () => {
        categoryRepo.findOne
          .mockResolvedValueOnce(mockCategory as BoardCategory)
          .mockResolvedValueOnce({ ...mockCategory, label: '질문게시판' } as BoardCategory);

        const result = await service.updateCategory('cat-123', { label: '질문게시판' });

        expect(result.label).toBe('질문게시판');
      });

      it('should throw NotFoundException for non-existent category', async () => {
        categoryRepo.findOne.mockResolvedValue(null);

        await expect(service.updateCategory('invalid', { label: 'Test' })).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deleteCategory', () => {
      it('should soft delete category', async () => {
        categoryRepo.findOne.mockResolvedValue(mockCategory as BoardCategory);

        await service.deleteCategory('cat-123');

        expect(categoryRepo.update).toHaveBeenCalledWith('cat-123', {
          status: BoardCategoryStatus.DISABLED,
        });
      });
    });
  });
});
