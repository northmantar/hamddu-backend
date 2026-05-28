import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChallengesController } from "./challenges.controller";
import { ChallengesService } from "./challenges.service";
import { Challenge } from "@entities/challenge.entity";
import { Content } from "@entities/content.entity";
import { RewardsModule } from "../rewards/rewards.module";

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, Content]), RewardsModule],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
