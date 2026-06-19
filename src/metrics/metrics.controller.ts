import { Controller, Get, Post, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
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

  @Post('toggle-lock')
  async toggleLock(@Req() req: any) {
    if (req.user?.role !== 'Admin') {
      throw new UnauthorizedException('Only an Admin can mutate systemic configurations.');
    }

    return this.metricsService.toggleLockState(req.user);
  }
}