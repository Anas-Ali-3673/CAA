import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private primaryDown = false;

  constructor(
    @InjectConnection('primary') private primaryConnection: Connection,
    @InjectConnection('fallback') private fallbackConnection: Connection,
  ) {}

  getConnection(): Connection {
    if (this.primaryDown || this.primaryConnection.readyState !== 1) {
      this.logger.warn('Primary database unavailable, switching to fallback');
      return this.fallbackConnection;
    }
    return this.primaryConnection;
  }

  setPrimaryDown(down: boolean) {
    this.primaryDown = down;
    this.logger.log(`Primary database manually set to: ${down ? 'DOWN' : 'UP'}`);
  }

  isPrimaryDown(): boolean {
    return this.primaryDown || this.primaryConnection.readyState !== 1;
  }
}