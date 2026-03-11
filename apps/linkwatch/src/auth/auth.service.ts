import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { AuthResponseDto, GoogleSignInDto, RefreshTokenDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private refreshTokenStore: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor(
    private jwtService: JwtService,
    private authRepository: AuthRepository,
  ) { }

  async googleSignIn(googleProfile: any): Promise<AuthResponseDto> {
    // Find or create user
    const user = await this.authRepository.findOrCreateUser(
      googleProfile.email,
      `${googleProfile.firstName || ''} ${googleProfile.lastName || ''}`.trim(),
      googleProfile.picture,
    );

    // Find or create account
    const account = await this.authRepository.findAccountByProviderAndId(
      'google',
      googleProfile.googleId,
    );

    if (!account) {
      await this.authRepository.createAccount(
        user.id,
        'google',
        googleProfile.googleId,
        googleProfile.accessToken,
        googleProfile.refreshToken,
      );
    } else {
      // Update tokens if they changed
      await this.authRepository.updateAccountTokens(
        account.id,
        googleProfile.accessToken,
        googleProfile.refreshToken,
      );
    }

    return this.generateAuthResponse(user);
  }

  async signTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: Number(process.env.JWT_EXPIRES_IN) || 900,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 604800,
      },
    );

    // Store refresh token
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    this.refreshTokenStore.set(userId, { token: refreshToken, expiresAt });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
    try {
      const decoded = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      });

      const userId = decoded.sub;
      const storedRefresh = this.refreshTokenStore.get(userId);

      if (!storedRefresh || storedRefresh.token !== refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (storedRefresh.expiresAt < Date.now()) {
        this.refreshTokenStore.delete(userId);
        throw new UnauthorizedException('Refresh token expired');
      }

      const user = await this.authRepository.findUserById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const accessPayload = {
        sub: userId,
        email: user.email,
      };

      const newAccessToken = await this.jwtService.signAsync(
        accessPayload,
        {
          secret: process.env.JWT_SECRET || 'your-secret-key',
          expiresIn: Number(process.env.JWT_EXPIRES_IN) || 900,
        },
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateAuthResponse(user: any): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } = await this.signTokens(user.id, user.email);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    };
  }

  create(createAuthDto: any) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: any) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
