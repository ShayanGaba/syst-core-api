import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SystemNode {
  id: string;
  name: string;
  type: 'consumer' | 'enterprise' | 'secure';
  status: 'ONLINE' | 'THROTTLED' | 'ISOLATED' | 'COMPROMISED';
  bandwidthUsage: number;
  slaPerformance: number;
  monthlyCalls: string;
}

@Injectable()
export class MetricsService {
  private fallbackNodes: SystemNode[] = [
    {
      id: 'node-alpha-01',
      name: 'Aegis Core Primary',
      type: 'secure',
      status: 'ONLINE',
      bandwidthUsage: 42,
      slaPerformance: 99.9,
      monthlyCalls: '1.8M',
    },
    {
      id: 'node-beta-02',
      name: 'Edge Gateway Secondary',
      type: 'enterprise',
      status: 'ONLINE',
      bandwidthUsage: 68,
      slaPerformance: 98.2,
      monthlyCalls: '920K',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getNodes() {
    try {
      const dbNodes = await this.prisma.systemNode.findMany();
      return dbNodes.length > 0
        ? (dbNodes as unknown as SystemNode[])
        : this.fallbackNodes;
    } catch (error) {
      return this.fallbackNodes;
    }
  }

  async getLogs() {
    try {
      const logs = await this.prisma.systemLog.findMany({
        orderBy: { id: 'desc' },
        take: 35,
      });

      if (logs.length === 0) return this.getMockLogs();

      return logs.map((log: any) => ({
        timestamp: log.createdAt
          ? log.createdAt.toISOString()
          : new Date().toISOString(),
        scope: log.tenantId || 'GLOBAL_SYSTEM',
        event: log.action,
        severity: log.status === 'WARNING' ? 'WARN' : log.status,
      }));
    } catch (error) {
      return this.getMockLogs();
    }
  }

  async toggleNodeStatus(
    nodeId: string,
    instruction: 'THROTTLE' | 'ISOLATE' | 'RESTORE',
  ) {
    let targetStatus: 'ONLINE' | 'THROTTLED' | 'ISOLATED' = 'ONLINE';
    if (instruction === 'THROTTLE') targetStatus = 'THROTTLED';
    if (instruction === 'ISOLATE') targetStatus = 'ISOLATED';

    try {
      await this.prisma.systemNode.update({
        where: { id: nodeId },
        data: { status: targetStatus },
      });

      // Write action to terminal feed log
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
      await this.prisma.systemLog.create({
        data: {
          action: `NODE_${nodeId.toUpperCase()}_STATUS_MUTATION_TO_${targetStatus}`,
          status: 'SUCCESS',
          tenantId: 'SYSTEM_ADMIN',
        },
      });
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    } catch (error) {
      const node = this.fallbackNodes.find((n) => n.id === nodeId);
      if (node) node.status = targetStatus;
    }
    return this.getNodes();
  }

  async provisionNewNode(
    name: string,
    type: 'consumer' | 'enterprise' | 'secure',
  ) {
    const newNode: SystemNode = {
      id: `node-${Math.random().toString(36).substring(2, 7)}`,
      name,
      type,
      status: 'ONLINE',
      bandwidthUsage: Math.floor(Math.random() * 30) + 10,
      slaPerformance: parseFloat((Math.random() * 2 + 98).toFixed(1)),
      monthlyCalls: '10K',
    };

    try {
      await this.prisma.systemNode.create({ data: newNode });

      // Write action to terminal feed log
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
      await this.prisma.systemLog.create({
        data: {
          action: `CLUSTER_INFRASTRUCTURE_EXPANSION_PROVISIONED_${newNode.id.toUpperCase()}`,
          status: 'SUCCESS',
          tenantId: 'SYSTEM_ADMIN',
        },
      });
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    } catch (error) {
      this.fallbackNodes.push(newNode);
    }
    return this.getNodes();
  }

  async engageCounterMeasureShield() {
    try {
      await this.prisma.systemNode.updateMany({
        data: { status: 'ONLINE' },
      });

      // Write action to terminal feed log
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
      await this.prisma.systemLog.create({
        data: {
          action: 'ACTIVE_COUNTER_MEASURE_SHIELD_ENGAGED_GLOBAL',
          status: 'SUCCESS',
          tenantId: 'SYSTEM_ADMIN',
        },
      });
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    } catch (error) {
      this.fallbackNodes.forEach((n) => (n.status = 'ONLINE'));
    }

    const currentNodes = await this.getNodes();
    return {
      nodes: currentNodes,
      shieldActive: true,
    };
  }

  async injectBreachSimulation() {
    try {
      const current = await this.prisma.systemNode.findMany();
      if (current.length > 0) {
        await this.prisma.systemNode.update({
          where: { id: current[0].id },
          data: { status: 'COMPROMISED' },
        });
      }

      // Write action to terminal feed log
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
      await this.prisma.systemLog.create({
        data: {
          action: 'MALICIOUS_BREACH_DDOS_VECTOR_SIMULATION_INJECTED',
          status: 'WARNING',
          tenantId: 'SYSTEM_ADMIN',
        },
      });
      await this.prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    } catch (error) {
      if (this.fallbackNodes.length > 0) {
        this.fallbackNodes[0].status = 'COMPROMISED';
      }
    }

    const currentNodes = await this.getNodes();
    return {
      nodes: currentNodes,
      attackActive: true,
    };
  }

  async getLockState() {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { id: 'global_config' },
      });
      return { systemLockActive: config?.systemLockActive ?? false };
    } catch {
      return { systemLockActive: false };
    }
  }

  async toggleLockState(user: any) {
    try {
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
    } catch {
      return { systemLockActive: true };
    }
  }

  private getMockLogs() {
    return [
      {
        timestamp: new Date().toISOString(),
        scope: 'SYSTEM_KERNEL',
        event: 'CORE_HYPERVISOR_ONLINE',
        severity: 'SUCCESS' as const,
      },
    ];
  }
}
