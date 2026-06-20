import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@UseGuards(AuthGuard('jwt'))
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics() {
    return this.metricsService.getLockState();
  }

  // 1. ADD THE NODES ROUTE (Maps to GET /metrics/nodes)
  @Get('nodes')
  async getNodes() {
    // Call whatever method you have in metricsService to fetch nodes/configs
    return this.metricsService.getNodes();
  }

  // 2. ADD THE LOGS ROUTE (Maps to GET /metrics/logs)
  @Get('logs')
  async getLogs() {
    // Call whatever method you have in metricsService to fetch system logs
    return this.metricsService.getLogs();
  }

  @Post('toggle-lock')
  async toggleLock(@Req() req: any) {
    if (req.user?.role !== 'Admin') {
      throw new UnauthorizedException(
        'Only an Admin can mutate systemic configurations.',
      );
    }

    return this.metricsService.toggleLockState(req.user);
  }
}
