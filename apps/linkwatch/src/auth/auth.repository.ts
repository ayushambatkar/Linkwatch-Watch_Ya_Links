import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class AuthRepository {
    constructor(private prisma: PrismaService) { }

    async findOrCreateUser(email: string, name?: string, image?: string) {
        return this.prisma.user.upsert({
            where: { email },
            update: { name, image },
            create: {
                email,
                name: name || email.split('@')[0],
                image,
            },
        });
    }

    async findUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async createAccount(
        userId: string,
        provider: string,
        providerAccountId: string,
        accessToken?: string,
        refreshToken?: string,
        expiresAt?: number,
    ) {
        return this.prisma.account.create({
            data: {
                userId,
                type: 'oauth',
                provider,
                providerAccountId,
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
                token_type: 'Bearer',
            },
        });
    }

    async findAccountByProviderAndId(provider: string, providerAccountId: string) {
        return this.prisma.account.findFirst({
            where: { provider, providerAccountId },
            include: { user: true },
        });
    }

    async updateAccountTokens(
        accountId: string,
        accessToken?: string,
        refreshToken?: string,
        expiresAt?: number,
    ) {
        return this.prisma.account.update({
            where: { id: accountId },
            data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
            },
        });
    }

    async storeRefreshToken(userId: string, refreshToken: string, expiresAt: number) {
        // Store refresh token in a cache or database table
        // For now, we'll implement this as a simple in-memory store
        // In production, use Redis or a dedicated table
        return { userId, refreshToken, expiresAt };
    }
}
