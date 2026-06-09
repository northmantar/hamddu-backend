import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContentsController } from "./contents.controller";
import { WatchHistoryController } from "./watch-history.controller";
import { ContentsService } from "./contents.service";
import { WatchHistoryService } from "./watch-history.service";
import { Content } from "@entities/content.entity";
import { Channel } from "@entities/channel.entity";
import { WatchHistory } from "@entities/watch-history.entity";
import { Challenge } from "@entities/challenge.entity";
import { User } from "@entities/user.entity";
import { RewardsModule } from "../rewards/rewards.module";
import { AdminGuard } from "../common/guards/admin.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Content,
      Channel,
      WatchHistory,
      Challenge,
      User,
    ]),
    RewardsModule,
  ],
  controllers: [ContentsController, WatchHistoryController],
  providers: [ContentsService, WatchHistoryService, AdminGuard],
  exports: [ContentsService, WatchHistoryService],
})
export class ContentsModule {}
