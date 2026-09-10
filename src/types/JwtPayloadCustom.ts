export interface JwtPayloadCustom {
  sub: string;
  email: string;
  fullName: string;
  role?: {
    isSuperAdmin?: boolean;
    permissions?: string[];
  };
  iat: number;
  exp: number;
}
