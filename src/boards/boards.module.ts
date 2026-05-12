import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BoardsController } from "./boards.controller";
import { BoardsService } from "./boards.service";
import { CommentsService } from "./comments.service";
import { Board } from "@entities/board.entity";
import { BoardLike } from "@entities/board-like.entity";
import { BoardCategory } from "@entities/board-category.entity";
import { BoardComment } from "@entities/board-comment.entity";
import { BoardCommentLike } from "@entities/board-comment-like.entity";
import { User } from "@entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board,
      BoardLike,
      BoardCategory,
      BoardComment,
      BoardCommentLike,
      User,
    ]),
  ],
  controllers: [BoardsController],
  providers: [BoardsService, CommentsService],
  exports: [BoardsService, CommentsService],
})
export class BoardsModule {}
