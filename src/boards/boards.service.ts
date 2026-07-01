import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { Board } from "@entities/board.entity";
import { BoardLike } from "@entities/board-like.entity";
import { BoardCategory } from "@entities/board-category.entity";
import { BoardMedia } from "@entities/board-media.entity";
import { Media } from "@entities/media.entity";
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
import { RewardAction } from "../rewards/constants/reward-events";

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,
    @InjectRepository(BoardLike)
    private readonly boardLikeRepo: Repository<BoardLike>,
    @InjectRepository(BoardCategory)
    private readonly categoryRepo: Repository<BoardCategory>,
    @InjectRepository(BoardMedia)
    private readonly boardMediaRepo: Repository<BoardMedia>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
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
      .leftJoinAndSelect("board.boardMedia", "boardMedia")
      .leftJoinAndSelect("boardMedia.media", "media")
      .where("board.status = :status", { status: BoardStatus.PUBLISHED })
      .andWhere("board.deletedAt IS NULL")
      .andWhere("board.isHidden = :isHidden", { isHidden: false });

    if (categoryId) {
      qb.andWhere("board.categoryId = :categoryId", { categoryId });
    }

    if (sort === BoardSortOption.POPULAR) {
      qb.orderBy("board.likeCount", "DESC").addOrderBy("board.createdAt", "DESC");
    } else {
      qb.orderBy("board.createdAt", "DESC");
    }

    const [data, totalCount] = await qb.skip(skip).take(limit).getManyAndCount();

    data.forEach((board) => {
      if (board.boardMedia) {
        board.boardMedia.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    });

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
      where: { id, deletedAt: IsNull(), isHidden: false },
      relations: ["member", "category", "boardMedia", "boardMedia.media"],
    });

    if (!board) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    if (board.boardMedia) {
      board.boardMedia.sort((a, b) => a.sortOrder - b.sortOrder);
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

    if (dto.mediaIds?.length) {
      const mediaCount = await this.mediaRepo.countBy({ id: In(dto.mediaIds) });
      if (mediaCount !== dto.mediaIds.length) {
        throw new BadRequestException("유효하지 않은 미디어 ID가 포함되어 있습니다.");
      }
    }

    const board = this.boardRepo.create({
      memberId,
      categoryId: dto.categoryId,
      title: dto.title,
      body: dto.body,
      status: dto.status ?? BoardStatus.PUBLISHED,
    });

    const saved = await this.boardRepo.save(board);

    if (dto.mediaIds?.length) {
      const boardMediaEntities = dto.mediaIds.map((mediaId, index) =>
        this.boardMediaRepo.create({
          boardId: saved.id,
          mediaId,
          sortOrder: index,
        }),
      );
      await this.boardMediaRepo.save(boardMediaEntities);
    }

    await this.rewardsService.enqueueReward({
      memberId,
      actionType: RewardActionType.BOARD_CREATED,
      refType: 'board',
      refAction: RewardAction.CREATE,
      refId: saved.id,
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

    if (dto.mediaIds !== undefined) {
      if (dto.mediaIds.length) {
        const mediaCount = await this.mediaRepo.countBy({ id: In(dto.mediaIds) });
        if (mediaCount !== dto.mediaIds.length) {
          throw new BadRequestException("유효하지 않은 미디어 ID가 포함되어 있습니다.");
        }
      }

      await this.boardMediaRepo.delete({ boardId });

      if (dto.mediaIds.length) {
        const boardMediaEntities = dto.mediaIds.map((mediaId, index) =>
          this.boardMediaRepo.create({
            boardId,
            mediaId,
            sortOrder: index,
          }),
        );
        await this.boardMediaRepo.save(boardMediaEntities);
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
