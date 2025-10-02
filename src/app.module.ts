import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { AuditModule } from './audit/audit.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Fallback Database Connection
    MongooseModule.forRootAsync({
      connectionName: 'fallback',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const fallbackUri = configService.get<string>('MONGODB_FALLBACK_URI');
        if (!fallbackUri) {
          console.log('Fallback database URI not configured, using primary as fallback');
          // Use primary URI for fallback connection when fallback is not available
          return {
            uri: configService.get<string>('MONGODB_PRIMARY_URI') || 'mongodb://localhost:27017/primary',
            retryAttempts: 0,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            connectionFactory: (connection) => {
              connection.on('error', (error) => {
                console.log('Fallback DB connection error (using primary URI):', error.message);
              });
              return connection;
            },
          };
        }
        return {
          uri: fallbackUri,
          retryAttempts: 5,
          retryDelay: 3000,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('Fallback DB connected successfully');
            });
            connection.on('error', (error) => {
              console.error('Fallback DB error:', error.message);
            });
            return connection;
          },
        };
      },
    }),
    // Primary Database Connection (Optional)
    MongooseModule.forRootAsync({
      connectionName: 'primary',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const primaryUri = configService.get<string>('MONGODB_PRIMARY_URI');
        if (!primaryUri) {
          console.log('Primary database URI not configured, using fallback as primary');
          // Use fallback URI for primary connection when primary is not available
          return {
            uri: configService.get<string>('MONGODB_FALLBACK_URI') || 'mongodb://localhost:27018/fallback',
            retryAttempts: 0,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            connectionFactory: (connection) => {
              connection.on('error', (error) => {
                console.log('Primary DB connection error (using fallback URI):', error.message);
              });
              return connection;
            },
          };
        }
        return {
          uri: primaryUri,
          retryAttempts: 1,
          retryDelay: 1000,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          connectionFactory: (connection) => {
            connection.on('error', (error) => {
              console.log('Primary DB connection error:', error.message);
            });
            connection.on('disconnected', () => {
              console.log('Primary DB disconnected');
            });
            return connection;
          },
        };
      },
    }),

    UsersModule,
    AuthModule, 
    TicketsModule,
    AuditModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}