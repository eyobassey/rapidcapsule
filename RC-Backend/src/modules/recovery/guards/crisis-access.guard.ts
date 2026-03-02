import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

/**
 * Crisis access guard — allows authenticated users to access crisis endpoints
 * regardless of recovery enrollment status. This ensures emergency functionality
 * is always available.
 *
 * Used in conjunction with JwtAuthGuard — authentication is still required,
 * but recovery enrollment is not.
 */
@Injectable()
export class CrisisAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Only require that the user is authenticated (JWT guard runs first)
    if (!request.user?.sub) {
      return false;
    }

    // Mark request as crisis access for downstream logging
    request.isCrisisAccess = true;
    return true;
  }
}
