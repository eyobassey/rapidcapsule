import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Custom guard that allows either:
 * 1. Valid JWT authentication (for regular users)
 * 2. Admin request header (for admin backend)
 */
@Injectable()
export class AdminOrJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if this is an admin request
    const isAdminRequest = request.headers['x-admin-request'] === 'true';
    const hasSpecialistId = !!request.headers['x-specialist-id'];

    console.log('[AdminOrJwtGuard] Headers:', {
      'x-admin-request': request.headers['x-admin-request'],
      'x-specialist-id': request.headers['x-specialist-id'],
      isAdminRequest,
      hasSpecialistId
    });

    if (isAdminRequest && hasSpecialistId) {
      // Allow admin requests without JWT validation
      // Set a dummy user object to prevent errors in the controller
      request.user = { sub: request.headers['x-specialist-id'], role: 'admin' };
      console.log('[AdminOrJwtGuard] Admin request authorized');
      return true;
    }

    // Otherwise, use normal JWT authentication
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWTKEY,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
