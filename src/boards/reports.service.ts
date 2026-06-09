import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Board } from "@entities/board.entity";
import { BoardReport } from "@entities/board-report.entity";
import { User } from "@entities/user.entity";
import { ReportStatus } from "@enums/report.enum";
import { UserType } from "@enums/user.enum";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { ReportQueryDto } from "./dto/report-query.dto";
import { PaginationMeta } from "./dto/pagination.dto";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(BoardReport)
    private readonly reportRepo: Repository<BoardReport>,
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(
    boardId: string,
    reporterId: string,
    dto: CreateReportDto,
  ): Promise<BoardReport> {
    // 게시글 존재 확인
    const board = await this.boardRepo.findOne({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException("게시글을 찾을 수 없습니다.");
    }

    // 자기 게시글 신고 방지
    if (board.memberId === reporterId) {
      throw new ForbiddenException("본인의 게시글은 신고할 수 없습니다.");
    }

    // 중복 신고 확인
    const existingReport = await this.reportRepo.findOne({
      where: { boardId, reporterId },
    });

    if (existingReport) {
      throw new ConflictException("이미 신고한 게시글입니다.");
    }

    const report = this.reportRepo.create({
      boardId,
      reporterId,
      reason: dto.reason,
      description: dto.description ?? null,
      status: ReportStatus.PENDING,
    });

    return this.reportRepo.save(report);
  }

  async findById(id: string): Promise<BoardReport> {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ["reporter", "board"],
    });

    if (!report) {
      throw new NotFoundException("신고를 찾을 수 없습니다.");
    }

    return report;
  }

  async findAll(
    query: ReportQueryDto,
  ): Promise<{ data: BoardReport[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.reportRepo
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.reporter", "reporter")
      .leftJoinAndSelect("report.board", "board");

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

  async findByBoardId(
    boardId: string,
    query: ReportQueryDto,
  ): Promise<{ data: BoardReport[]; meta: PaginationMeta }> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.reportRepo
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.reporter", "reporter")
      .leftJoinAndSelect("report.board", "board")
      .where("report.boardId = :boardId", { boardId });

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
  ): Promise<BoardReport> {
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

    await this.reportRepo.update(reportId, {
      status: dto.status,
      processedAt: new Date(),
    });

    return this.findById(reportId);
  }
}
