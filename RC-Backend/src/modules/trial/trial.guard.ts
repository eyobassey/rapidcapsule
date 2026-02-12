import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TrialService } from './trial.service';

@Injectable()
export class TrialGuard implements CanActivate {
  constructor(private readonly trialService: TrialService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-trial-token'];

    if (!token) {
      throw new UnauthorizedException('Trial token is required.');
    }

    const session = await this.trialService.validateTrialSession(token);
    request.trialSession = session;
    return true;
  }
}
