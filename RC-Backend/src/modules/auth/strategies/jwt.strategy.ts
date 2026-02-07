import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IJwtPayload } from '../types/jwt-payload.type';
import { UsersService } from '../../users/users.service';
import { Messages } from '../../../core/messages/messages';
import { SessionService } from '../session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWTKEY,
    });
  }

  async validate(payload: IJwtPayload & { tokenId?: string }) {
    // check if user in the token actually exist
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(Messages.UNAUTHORIZED);
    }

    // If token has a tokenId, validate the session is still active
    if (payload.tokenId) {
      const isSessionValid = await this.sessionService.isSessionValid(payload.tokenId);
      if (!isSessionValid) {
        throw new UnauthorizedException('Session has been revoked');
      }

      // Update last active time (async, don't wait)
      this.sessionService.updateLastActive(payload.tokenId).catch(() => {});
    }

    return payload;
  }
}
