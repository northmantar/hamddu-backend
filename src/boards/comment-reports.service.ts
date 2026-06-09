import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BoardComment } from "@entities/board-comment.entity";
import { CommentReport } from "@entities/comment-report.entity";
import { User } from "@entities/user.entity";
import { ReportStatus } from "@enums/report.enum";
import { UserType } from "@enums/user.enum";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { ReportQueryDto } from "./dto/report-query.dto";
import { PaginationMeta } from "./dto/pagination.dto";

@Injectable()
export class CommentReportsService {
  constructor(
    @InjectRepository(CommentReport)
    private readonly reportRepo: Repository<CommentReport>,
    @InjectRepository(BoardComment)
    private readonly commentRepo: Repository<BoardComment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(
    commentId: string,
    reporterId: string,
    dto: CreateReportDto,
  ): Promise<CommentReport> {
    // 댓글 존재 확인
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException("댓글을 찾을 수 없습니다.");
    }

    // 자기 댓글 신고 방지
    if (comment.memberId === reporterId) {
      throw new ForbiddenException("본인의 댓글은 신고할 수 없습니다.");
    }

    // 중복 신고 확인
    const existingReport = await this.reportRepo.findOne({
      where: { commentId, reporterId },
    });

    if (existingReport) {
      throw new ConflictException("이미 신고한 댓글입니다.");
    }

    const report = this.reportRepo.create({
      commentId,
      reporterId,
      reason: dto.reason,
      description: dto.description ?? null,
      status: ReportStatus.PENDING,
    });

    return this.reportRepo.save(report);
  }

  async findById(id: string): Promise<CommentReport> {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ["reporter", "comment"],
    });

    if (!report) {
      throw new NotFoundException("신고를 찾을 수 없습니다.");
    }

    return report;
  }

  async findAll(
    query: ReportQueryDto,
  ): Promise<{ data: CommentReport[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.reportRepo
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.reporter", "reporter")
      .leftJoinAndSelect("report.comment", "comment");

    if (status) {
      qb.where("report.status = :status", { status });
    }

    qb.orderBy("report.createdAt", "DESC");

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

  async findByCommentId(
    commentId: string,
    query: ReportQueryDto,
  ): Promise<{ data: CommentReport[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.reportRepo
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.reporter", "reporter")
      .leftJoinAndSelect("report.comment", "comment")
      .where("report.commentId = :commentId", { commentId });

    if (status) {
      qb.andWhere("report.status = :status", { status });
    }

    qb.orderBy("report.createdAt", "DESC");

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

  async update(
    reportId: string,
    memberId: string,
    dto: UpdateReportDto,
  ): Promise<CommentReport> {
    // 관리자 권한 확인
    const user = await this.userRepo.findOne({ where: { id: memberId } });
    if (user?.type !== UserType.ADMIN) {
      throw new ForbiddenException("접근 권한이 없습니다.");
    }

    const report = await this.findById(reportId);

    // 이미 처리된 신고인지 확인
    if (report.status !== ReportStatus.PENDING) {
      throw new ConflictException("이미 처리된 신고입니다.");
    }

    // 신고 승인(resolved) 시 댓글 숨김 처리
    if (dto.status === ReportStatus.RESOLVED) {
      await this.commentRepo.update(report.commentId, { isHidden: true });
    }

    await this.reportRepo.update(reportId, {
      status: dto.status,
      processedAt: new Date(),
    });

    return this.findById(reportId);
  }
}
