import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { Board } from "@entities/board.entity";
import { BoardLike } from "@entities/board-like.entity";
import { BoardCategory } from "@entities/board-category.entity";
import { BoardStatus, BoardCategoryStatus } from "@enums/board.enum";
import { UserType } from "@enums/user.enum";
import { CreateBoardDto } from "./dto/create-board.dto";
import { UpdateBoardDto } from "./dto/update-board.dto";
import { BoardQueryDto, BoardSortOption } from "./dto/board-query.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { PaginationMeta } from "./dto/pagination.dto";
import { User } from "@entities/user.entity";
import { RewardsService } from "../rewards/rewards.service";
import { RewardActionType } from "../rewards/constants/reward.constants";

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,
    @InjectRepository(BoardLike)
    private readonly boardLikeRepo: Repository<BoardLike>,
    @InjectRepository(BoardCategory)
    private readonly categoryRepo: Repository<BoardCategory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly rewardsService: RewardsService,
  ) {}

  async findAll(
    query: BoardQueryDto,
  ): Promise<{ data: Board[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, categoryId, sort = BoardSortOption.LATEST } = query;
    const skip = (page - 1) * limit;

    const qb = this.boardRepo
      .createQueryBuilder("board")
      .leftJoinAndSelect("board.member", "member")
      .leftJoinAndSelect("board.category", "category")
      .where("board.status = :status", { status: BoardStatus.PUBLISHED })
      .andWhere("board.deletedAt IS NULL");

    if (categoryId) {
      qb.andWhere("board.categoryId = :categoryId", { categoryId });
    }

    if (sort === BoardSortOption.POPULAR) {
      qb.orderBy("board.likeCount", "DESC").addOrderBy("board.createdAt", "DESC");
    } else {
      qb.orderBy("board.createdAt", "DESC");
    }

    const [data, totalCount] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findById(id: string): Promise<Board> {
    const board = await this.boardRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["member", "category"],
    });

    if (!board) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    return board;
  }

  async isLikedByUser(boardId: string, memberId: string): Promise<boolean> {
    return this.boardLikeRepo.existsBy({ boardId, memberId });
  }

  async create(memberId: string, dto: CreateBoardDto): Promise<Board> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId, status: BoardCategoryStatus.ENABLED },
    });

    if (!category) {
      throw new BadRequestException("유효하지 않은 카테고리입니다.");
    }

    const board = this.boardRepo.create({
      memberId,
      categoryId: dto.categoryId,
      title: dto.title,
      body: dto.body,
      status: dto.status ?? BoardStatus.PUBLISHED,
    });

    const saved = await this.boardRepo.save(board);

    await this.rewardsService.enqueueReward({
      memberId,
      actionType: RewardActionType.BOARD_CREATED,
      refId: saved.id,
      refType: 'board',
    });

    return this.findById(saved.id);
  }

  async update(boardId: string, memberId: string, dto: UpdateBoardDto): Promise<Board> {
    const board = await this.findById(boardId);
    const user = await this.userRepo.findOne({ where: { id: memberId } });

    if (board.memberId !== memberId && user?.type !== UserType.ADMIN) {
      throw new ForbiddenException("접근 권한이 없습니다.");
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId, status: BoardCategoryStatus.ENABLED },
      });
      if (!category) {
        throw new BadRequestException("유효하지 않은 카테고리입니다.");
      }
    }

    await this.boardRepo.update(boardId, {
      ...(dto.categoryId && { categoryId: dto.categoryId }),
      ...(dto.title && { title: dto.title }),
      ...(dto.body && { body: dto.body }),
    });

    return this.findById(boardId);
  }

  async delete(boardId: string, memberId: string): Promise<void> {
    const board = await this.findById(boardId);
    const user = await this.userRepo.findOne({ where: { id: memberId } });

    if (board.memberId !== memberId && user?.type !== UserType.ADMIN) {
      throw new ForbiddenException("접근 권한이 없습니다.");
    }

    await this.boardRepo.update(boardId, {
      status: BoardStatus.DELETED,
      deletedAt: new Date(),
    });
  }

  async like(boardId: string, memberId: string): Promise<{ likeCount: number }> {
    await this.findById(boardId);

    const existingLike = await this.boardLikeRepo.findOne({
      where: { boardId, memberId },
    });

    if (existingLike) {
      throw new ConflictException("이미 좋아요한 게시글입니다.");
    }

    await this.boardLikeRepo.save({ boardId, memberId });
    await this.boardRepo.increment({ id: boardId }, "likeCount", 1);

    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    return { likeCount: board!.likeCount };
  }

  async unlike(boardId: string, memberId: string): Promise<{ likeCount: number }> {
    await this.findById(boardId);

    const existingLike = await this.boardLikeRepo.findOne({
      where: { boardId, memberId },
    });

    if (!existingLike) {
      throw new NotFoundException("좋아요 기록이 없습니다.");
    }

    await this.boardLikeRepo.delete({ boardId, memberId });
    await this.boardRepo.decrement({ id: boardId }, "likeCount", 1);

    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    return { likeCount: board!.likeCount };
  }

  async findAllCategories(): Promise<BoardCategory[]> {
    return this.categoryRepo.find({
      where: { status: BoardCategoryStatus.ENABLED },
      order: { createdAt: "ASC" },
    });
  }

  async findAllCategoriesForAdmin(): Promise<BoardCategory[]> {
    return this.categoryRepo.find({
      order: { createdAt: "ASC" },
    });
  }

  async findCategoryById(id: string): Promise<BoardCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException("카테고리를 찾을 수 없습니다.");
    }
    return category;
  }

  async createCategory(dto: CreateCategoryDto): Promise<BoardCategory> {
    const category = this.categoryRepo.create({
      label: dto.label,
      status: BoardCategoryStatus.ENABLED,
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<BoardCategory> {
    await this.findCategoryById(id);

    await this.categoryRepo.update(id, {
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    return this.findCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.findCategoryById(id);

    // 카테고리를 비활성화 처리 (soft delete)
    await this.categoryRepo.update(id, {
      status: BoardCategoryStatus.DISABLED,
    });
  }
}
