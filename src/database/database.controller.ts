import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('database')
@UseGuards(AuthGuard)
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('status')
  async getStatus(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can view database status');
    }
    return this.databaseService.getConnectionStatus();
  }

  @Post('toggle-primary')
  async togglePrimary(@Request() req, @Body() body: { down: boolean }) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can toggle database');
    }
    this.databaseService.setPrimaryDown(body.down);
    return { 
      message: `Primary database set to ${body.down ? 'DOWN' : 'UP'}`,
      status: this.databaseService.getConnectionStatus()
    };
  }

  @Get('test-connection')
  async testConnection(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admins can test connections');
    }
    
    const connection = this.databaseService.getConnection();
    const isHealthy = await this.databaseService.testConnection(connection);
    
    return {
      connection: connection.name || 'unknown',
      healthy: isHealthy,
      status: this.databaseService.getConnectionStatus()
    };
  }
}