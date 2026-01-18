import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class GoogleAuth {
  private client: OAuth2Client;
  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
  }

  async validate(token) {
    try {
      // Try to verify as ID token first (recommended approach)
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new BadRequestException('Invalid Google ID token payload');
      }
      return {
        email: payload.email || '',
        first_name: payload.given_name || '',
        last_name: payload.family_name || '',
        profile_photo: payload.picture || '',
      };
    } catch (idTokenError) {
      // Fallback to access token if ID token verification fails
      try {
        this.client.setCredentials({ access_token: token });
        const userinfo = await this.client.request({
          url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });
        const { email, family_name, given_name, picture } =
          userinfo.data as TokenPayload;
        return {
          email: <string>email || '',
          first_name: <string>given_name || '',
          last_name: <string>family_name || '',
          profile_photo: picture || '',
        };
      } catch (accessTokenError) {
        throw new BadRequestException('Invalid Google authentication token');
      }
    }
  }
}
