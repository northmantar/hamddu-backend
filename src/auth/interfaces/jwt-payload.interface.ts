export interface JwtPayload {
  /** User UUID */
  sub: string;
  iat?: number;
  exp?: number;
}
