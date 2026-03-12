import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor(private configService: ConfigService) {
        super({
            adapter: new PrismaPg({
                connectionString: configService.get('DATABASE_URL'),
            })
        });
    }
}
