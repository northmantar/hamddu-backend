import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChannelsController } from "./channels.controller";
import { ChannelsService } from "./channels.service";
import { Channel } from "@entities/channel.entity";
import { User } from "@entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Channel, User])],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
