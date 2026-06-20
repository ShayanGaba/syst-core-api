import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@UseGuards(AuthGuard('jwt'))
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('nodes')
  async getNodes(): Promise<any> {
    return this.metricsService.getNodes();
  }

  @Get('logs')
  async getLogs(): Promise<any> {
    return this.metricsService.getLogs();
  }

  @Post('nodes/:nodeId/status')
  async toggleNodeStatus(
    @Param('nodeId') nodeId: string,
    @Body('instruction') instruction: 'THROTTLE' | 'ISOLATE' | 'RESTORE',
  ): Promise<any> {
    return this.metricsService.toggleNodeStatus(nodeId, instruction);
  }

  @Post('nodes/provision')
  async provisionNewNode(
    @Body('name') name: string,
    @Body('type') type: 'consumer' | 'enterprise' | 'secure',
  ): Promise<any> {
    return this.metricsService.provisionNewNode(name, type);
  }

  @Post('system/shield')
  async engageCounterMeasureShield(): Promise<any> {
    return this.metricsService.engageCounterMeasureShield();
  }

  @Post('system/breach-test')
  async injectBreachSimulation(): Promise<any> {
    return this.metricsService.injectBreachSimulation();
  }

  @Get('lock-state')
  async getLockState(): Promise<any> {
    return this.metricsService.getLockState();
  }

  @Post('toggle-lock')
  async toggleLockState(@Request() req: any): Promise<any> {
    return this.metricsService.toggleLockState(req.user);
  }
}
