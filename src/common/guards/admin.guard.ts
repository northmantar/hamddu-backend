import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@entities/user.entity";
import { UserType } from "@enums/user.enum";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw new ForbiddenException("접근 권한이 없습니다.");
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user || user.type !== UserType.ADMIN) {
      throw new ForbiddenException("접근 권한이 없습니다.");
    }

    return true;
  }
}
