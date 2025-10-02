import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private primaryDown = false;

  constructor(
    @InjectConnection('primary') private primaryConnection: Connection,
    @InjectConnection('fallback') private fallbackConnection: Connection,
  ) {}

  onModuleInit() {
    const primaryUri = process.env.MONGODB_PRIMARY_URI;
    const fallbackUri = process.env.MONGODB_FALLBACK_URI;
    
    if (!primaryUri) {
      this.primaryDown = true;
      this.logger.warn('Primary database URI not configured');
    }

    this.primaryConnection.on('connected', () => {
      if (primaryUri) {
        this.logger.log('Primary database connected');
        this.primaryDown = false;
      } else {
        this.logger.log('Primary connection established (using fallback URI)');
        this.primaryDown = true;
      }
    });

    this.primaryConnection.on('disconnected', () => {
      this.logger.warn('Primary database disconnected');
      this.primaryDown = true;
    });

    this.primaryConnection.on('error', (error) => {
      this.logger.error('Primary database error:', error.message);
      this.primaryDown = true;
    });

    this.fallbackConnection.on('connected', () => {
      if (fallbackUri) {
        this.logger.log('Fallback database connected');
      } else {
        this.logger.log('Fallback connection established (using primary URI)');
      }
    });

    this.fallbackConnection.on('error', (error) => {
      this.logger.error('Fallback database error:', error.message);
    });

    setTimeout(() => {
      this.logger.log(`Database configuration - Primary URI: ${!!primaryUri}, Fallback URI: ${!!fallbackUri}`);
      this.logger.log(`Connection status - Primary: ${this.primaryConnection.readyState === 1 ? 'Connected' : 'Disconnected'}, Fallback: ${this.fallbackConnection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      
      if (!primaryUri && !fallbackUri) {
        this.logger.error('No database URIs configured!');
      } else if (!primaryUri) {
        this.logger.log('Operating in fallback-only mode');
      } else if (!fallbackUri) {
        this.logger.log('Operating in primary-only mode (fallback uses primary URI)');
      } else {
        this.logger.log('Operating in dual-database mode');
      }
    }, 3000);
  }

  getConnection(): Connection {
    try {
      if (!this.primaryDown && this.primaryConnection.readyState === 1) {
        return this.primaryConnection;
      }

      this.logger.warn('Using fallback database');
      
      if (this.fallbackConnection.readyState !== 1) {
        this.logger.error('Both databases are unavailable!');
        throw new Error('Database unavailable');
      }

      return this.fallbackConnection;
    } catch (error) {
      this.logger.error('Error getting database connection:', error.message);
      if (this.fallbackConnection.readyState === 1) {
        return this.fallbackConnection;
      }
      throw new Error('All database connections failed');
    }
  }

  async testConnection(connection: Connection): Promise<boolean> {
    try {
      if (!connection.db) {
        return false;
      }
      await connection.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getHealthyConnection(): Promise<Connection> {
    if (!this.primaryDown && await this.testConnection(this.primaryConnection)) {
      return this.primaryConnection;
    }

    if (await this.testConnection(this.fallbackConnection)) {
      this.logger.warn('Primary failed health check, using fallback');
      this.primaryDown = true;
      return this.fallbackConnection;
    }

    throw new Error('No healthy database connection available');
  }

  setPrimaryDown(down: boolean) {
    this.primaryDown = down;
    this.logger.log(`Primary database manually set to: ${down ? 'DOWN' : 'UP'}`);
  }

  isPrimaryDown(): boolean {
    return this.primaryDown || this.primaryConnection.readyState !== 1;
  }

  async executeWithFailover<T>(primaryOperation: () => Promise<T>, fallbackOperation: () => Promise<T>): Promise<T> {
    const primaryUri = process.env.MONGODB_PRIMARY_URI;
    const fallbackUri = process.env.MONGODB_FALLBACK_URI;
    
    // If both URIs point to same database or only one is configured, just use primary
    if (!fallbackUri || !primaryUri) {
      if (this.primaryConnection.readyState === 1) {
        try {
          return await primaryOperation();
        } catch (error) {
          this.logger.error('Database operation failed:', error.message);
          throw error;
        }
      } else {
        throw new Error('Database connection not available');
      }
    }
    
    if (!this.primaryDown && this.primaryConnection.readyState === 1) {
      try {
        const result = await primaryOperation();
        return result;
      } catch (error) {
        this.logger.warn('Primary operation failed, switching to fallback:', error.message);
        this.primaryDown = true;
      }
    }
    
    if (this.fallbackConnection.readyState === 1) {
      try {
        const result = await fallbackOperation();
        this.logger.log('Operation completed using fallback database');
        return result;
      } catch (error) {
        this.logger.error('Fallback operation failed:', error.message);
        throw new Error('Fallback database operation failed: ' + error.message);
      }
    }
    
    this.logger.error('No database connections available');
    throw new Error('No database connections available');
  }

  getConnectionStatus() {
    return {
      primary: {
        state: this.primaryConnection.readyState,
        down: this.primaryDown,
        status: this.getReadyStateLabel(this.primaryConnection.readyState),
      },
      fallback: {
        state: this.fallbackConnection.readyState,
        status: this.getReadyStateLabel(this.fallbackConnection.readyState),
      },
    };
  }

  private getReadyStateLabel(state: number): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }
}