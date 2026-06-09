import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BoardsController } from "./boards.controller";
import { BoardsService } from "./boards.service";
import { CommentsService } from "./comments.service";
import { ReportsService } from "./reports.service";
import { CommentReportsService } from "./comment-reports.service";
import { AdminGuard } from "../common/guards/admin.guard";
import { RewardsModule } from "../rewards/rewards.module";
import { Board } from "@entities/board.entity";
import { BoardLike } from "@entities/board-like.entity";
import { BoardCategory } from "@entities/board-category.entity";
import { BoardComment } from "@entities/board-comment.entity";
import { BoardCommentLike } from "@entities/board-comment-like.entity";
import { BoardReport } from "@entities/board-report.entity";
import { CommentReport } from "@entities/comment-report.entity";
import { User } from "@entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board,
      BoardLike,
      BoardCategory,
      BoardComment,
      BoardCommentLike,
      BoardReport,
      CommentReport,
      User,
    ]),
    RewardsModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService, CommentsService, ReportsService, CommentReportsService, AdminGuard],
  exports: [BoardsService, CommentsService, ReportsService, CommentReportsService],
})
export class BoardsModule {}
