export class LoginDto {
  email: string;
  password?: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class GoogleSignInDto {
  idToken?: string;
  accessToken?: string;
  code?: string;
}
