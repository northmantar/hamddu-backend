import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Apply after JwtAuthGuard on routes that require the user to have
 * completed the post-login survey (e.g. creating content).
 *
 * Returns 403 { code: 'SURVEY_REQUIRED' } so the client can redirect
 * to the survey screen.
 */
@Injectable()
export class SurveyCompletedGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const payload: JwtPayload = context.switchToHttp().getRequest().user;
    const user = await this.usersService.findById(payload.sub);

    if (!user?.surveyCompletedAt) {
      throw new ForbiddenException({
        code: 'SURVEY_REQUIRED',
        message: 'Please complete the survey before continuing',
      });
    }
    return true;
  }
}
