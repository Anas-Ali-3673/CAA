import { Controller, Get, UseGuards, Request, ForbiddenException, Post, Body } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { DatabaseService } from '../database/database.service';

@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('logs')
  async getAuditLogs(@Request() req) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can view audit logs');
    }
    return this.auditService.getAuditLogs();
  }

  @Post('database/toggle')
  async togglePrimaryDatabase(@Request() req, @Body() body: { down: boolean }) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can toggle database');
    }
    this.databaseService.setPrimaryDown(body.down);
    return { message: `Primary database set to ${body.down ? 'DOWN' : 'UP'}` };
  }

  @Get('database/status')
  async getDatabaseStatus(@Request() req) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can view database status');
    }
    return { primaryDown: this.databaseService.isPrimaryDown() };
  }
}