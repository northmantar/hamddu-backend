import { Module } from "@nestjs/common";
import { NicknamesController } from "./nicknames.controller";
import { NicknamesService } from "./nicknames.service";
import { NicknameSequenceService } from "./nickname-sequence.service";
import { NicknameAdjective } from "@entities/nickname-adjective.entity";
import { NicknameNoun } from "@entities/nickname-noun.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NicknameBase } from "@entities/nickname-base.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([NicknameAdjective, NicknameNoun, NicknameBase]),
  ],
  controllers: [NicknamesController],
  providers: [NicknamesService, NicknameSequenceService],
  exports: [NicknamesService, NicknameSequenceService],
})
export class NicknamesModule {}
