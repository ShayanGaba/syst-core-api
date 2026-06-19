import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLockState() {
    const config = await this.prisma.systemConfig.findUnique({
      where: { id: 'global_config' },
    });
    return { systemLockActive: config?.systemLockActive ?? false };
  }

  async toggleLockState(user: any) {
    const config = await this.prisma.systemConfig.findUnique({
      where: { id: 'global_config' },
    });
    const nextState = !config?.systemLockActive;

    await this.prisma.systemConfig.upsert({
      where: { id: 'global_config' },
      update: { systemLockActive: nextState },
      create: { id: 'global_config', systemLockActive: nextState },
    });

    if (user?.tenantId) {
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

      await this.prisma.systemLog.create({
        data: {
          action: nextState
            ? 'MASTER_MUTATION_LOCK_ENABLED'
            : 'MASTER_MUTATION_LOCK_DISABLED',
          status: nextState ? 'WARNING' : 'SUCCESS',
          tenantId: user.tenantId,
        },
      });

      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    }

    return { systemLockActive: nextState };
  }
}
