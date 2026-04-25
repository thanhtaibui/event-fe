export interface JwtPayloadCustom {
  sub: string;
  email: string;
  fullName: string;
  iat: number;
  exp: number;
}