
export interface LoginReq {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterReq {
  fullName: string;
  email: string;
  password: string;
}

export interface GoogleLoginReq {
  idToken: string;
  rememberMe?: boolean;
}
