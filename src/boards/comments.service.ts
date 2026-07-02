import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { BoardComment } from "@entities/board-comment.entity";
import { BoardCommentLike } from "@entities/board-comment-like.entity";
import { Board } from "@entities/board.entity";
import { User } from "@entities/user.entity";
import { BoardStatus } from "@enums/board.enum";
import { UserType } from "@enums/user.enum";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { PaginationQueryDto, PaginationMeta } from "./dto/pagination.dto";
import { CommentResponseDto } from "./dto/comment-response.dto";
import { RewardsService } from "../rewards/rewards.service";
import { RewardAction } from "../rewards/constants/reward-events";

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(BoardComment)
    private readonly commentRepo: Repository<BoardComment>,
    @InjectRepository(BoardCommentLike)
    private readonly commentLikeRepo: Repository<BoardCommentLike>,
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly rewardsService: RewardsService,
  ) {}

  private async findBoardOrFail(boardId: string): Promise<Board> {
    const board = await this.boardRepo.findOne({
      where: { id: boardId, status: BoardStatus.PUBLISHED, deletedAt: IsNull() },
    });

    if (!board) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    return board;
  }

  private async findCommentOrFail(commentId: string): Promise<BoardComment> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ["member"],
    });

    if (!comment) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    return comment;
  }

  async findAll(
    boardId: string,
    memberId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: CommentResponseDto[]; meta: PaginationMeta }> {
    await this.findBoardOrFail(boardId);

    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // 루트 댓글만 가져옴 (숨김 처리된 댓글 제외)
    const [rootComments, totalCount] = await this.commentRepo.findAndCount({
      where: { boardId, parentId: IsNull(), isHidden: false },
      relations: ["member"],
      order: { createdAt: "ASC" },
      skip,
      take: limit,
    });

    // 모든 루트 댓글의 대댓글 가져오기
    const rootIds = rootComments.map((c) => c.id);
    let childComments: BoardComment[] = [];

    if (rootIds.length > 0) {
      childComments = await this.commentRepo
        .createQueryBuilder("comment")
        .leftJoinAndSelect("comment.member", "member")
        .where("comment.parentId IN (:...rootIds)", { rootIds })
        .andWhere("comment.isHidden = :isHidden", { isHidden: false })
        .orderBy("comment.createdAt", "ASC")
        .getMany();
    }

    // 좋아요 여부 확인
    const allCommentIds = [...rootIds, ...childComments.map((c) => c.id)];
    const likedCommentIds = new Set<string>();

    if (allCommentIds.length > 0) {
      const likes = await this.commentLikeRepo
        .createQueryBuilder("like")
        .where("like.commentId IN (:...commentIds)", { commentIds: allCommentIds })
        .andWhere("like.memberId = :memberId", { memberId })
        .getMany();

      likes.forEach((like) => likedCommentIds.add(like.commentId));
    }

    // 대댓글을 부모 댓글에 매핑
    const childrenByParentId = new Map<string, BoardComment[]>();
    childComments.forEach((child) => {
      const parentId = child.parentId!;
      if (!childrenByParentId.has(parentId)) {
        childrenByParentId.set(parentId, []);
      }
      childrenByParentId.get(parentId)!.push(child);
    });

    // 응답 DTO 생성
    const data = rootComments.map((root) => {
      const children = (childrenByParentId.get(root.id) || []).map((child) =>
        CommentResponseDto.from(child, likedCommentIds.has(child.id)),
      );
      return CommentResponseDto.from(root, likedCommentIds.has(root.id), children);
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

  async create(
    boardId: string,
    memberId: string,
    dto: CreateCommentDto,
  ): Promise<BoardComment> {
    await this.findBoardOrFail(boardId);

    let depth = 0;
    if (dto.parentId) {
      const parent = await this.findCommentOrFail(dto.parentId);

      if (parent.boardId !== boardId) {
        throw new BadRequestException("부모 댓글이 해당 게시글에 속하지 않습니다.");
      }

      if (parent.depth >= 1) {
        throw new BadRequestException("대댓글에는 답글을 달 수 없습니다.");
      }

      depth = parent.depth + 1;
    }

    const comment = this.commentRepo.create({
      boardId,
      memberId,
      parentId: dto.parentId ?? null,
      body: dto.body,
      depth,
    });

    const saved = await this.commentRepo.save(comment);

    await this.rewardsService.enqueueReward({
      memberId,
      refType: 'board_comment',
      refAction: RewardAction.CREATE,
      refId: saved.id,
    });

    return this.findCommentOrFail(saved.id);
  }

  async update(
    boardId: string,
    commentId: string,
    memberId: string,
    dto: UpdateCommentDto,
  ): Promise<BoardComment> {
    await this.findBoardOrFail(boardId);
    const comment = await this.findCommentOrFail(commentId);
    const user = await this.userRepo.findOne({ where: { id: memberId } });

    if (comment.boardId !== boardId) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    if (comment.memberId !== memberId && user?.type !== UserType.ADMIN) {
      throw new ForbiddenException("접근 권한이 없습니다.");
    }

    if (comment.deletedAt) {
      throw new BadRequestException("삭제된 댓글은 수정할 수 없습니다.");
    }

    await this.commentRepo.update(commentId, { body: dto.body });
    return this.findCommentOrFail(commentId);
  }

  async delete(boardId: string, commentId: string, memberId: string): Promise<void> {
    await this.findBoardOrFail(boardId);
    const comment = await this.findCommentOrFail(commentId);
    const user = await this.userRepo.findOne({ where: { id: memberId } });

    if (comment.boardId !== boardId) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    if (comment.memberId !== memberId && user?.type !== UserType.ADMIN) {
      throw new ForbiddenException("접근 권한이 없습니다.");
    }

    await this.commentRepo.update(commentId, { deletedAt: new Date() });
  }

  async like(
    boardId: string,
    commentId: string,
    memberId: string,
  ): Promise<{ likeCount: number }> {
    await this.findBoardOrFail(boardId);
    const comment = await this.findCommentOrFail(commentId);

    if (comment.boardId !== boardId) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    const existingLike = await this.commentLikeRepo.findOne({
      where: { commentId, memberId },
    });

    if (existingLike) {
      throw new ConflictException("이미 좋아요한 댓글입니다.");
    }

    await this.commentLikeRepo.save({ commentId, memberId });
    await this.commentRepo.increment({ id: commentId }, "likeCount", 1);

    const updated = await this.commentRepo.findOne({ where: { id: commentId } });
    return { likeCount: updated!.likeCount };
  }

  async unlike(
    boardId: string,
    commentId: string,
    memberId: string,
  ): Promise<{ likeCount: number }> {
    await this.findBoardOrFail(boardId);
    const comment = await this.findCommentOrFail(commentId);

    if (comment.boardId !== boardId) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    const existingLike = await this.commentLikeRepo.findOne({
      where: { commentId, memberId },
    });

    if (!existingLike) {
      throw new NotFoundException("좋아요 기록이 없습니다.");
    }

    await this.commentLikeRepo.delete({ commentId, memberId });
    await this.commentRepo.decrement({ id: commentId }, "likeCount", 1);

    const updated = await this.commentRepo.findOne({ where: { id: commentId } });
    return { likeCount: updated!.likeCount };
  }

  async isLikedByUser(commentId: string, memberId: string): Promise<boolean> {
    return this.commentLikeRepo.existsBy({ commentId, memberId });
  }
}
