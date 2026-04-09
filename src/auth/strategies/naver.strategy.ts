import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OAuthProfile } from '../interfaces/oauth-profile.interface';

interface NaverProfileResponse {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email: string;
    name?: string;
  };
}

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(config: ConfigService) {
    super({
      authorizationURL: 'https://nid.naver.com/oauth2.0/authorize',
      tokenURL: 'https://nid.naver.com/oauth2.0/token',
      clientID: config.get<string>('NAVER_CLIENT_ID'),
      clientSecret: config.get<string>('NAVER_CLIENT_SECRET'),
      callbackURL: config.get<string>('NAVER_CALLBACK_URL'),
    });
  }

  async validate(accessToken: string): Promise<OAuthProfile> {
    const { data } = await axios.get<NaverProfileResponse>(
      'https://openapi.naver.com/v1/nid/me',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return {
      providerUserId: data.response.id,
      email: data.response.email,
    };
  }
}
