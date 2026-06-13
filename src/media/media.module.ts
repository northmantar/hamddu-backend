import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { Media } from "@entities/media.entity";
import { User } from "@entities/user.entity";
import { AdminGuard } from "../common/guards/admin.guard";

@Module({
  imports: [TypeOrmModule.forFeature([Media, User])],
  controllers: [MediaController],
  providers: [MediaService, AdminGuard],
  exports: [MediaService],
})
export class MediaModule {}
