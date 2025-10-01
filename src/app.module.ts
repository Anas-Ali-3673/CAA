import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Primary database connection
    MongooseModule.forRoot(
      process.env.MONGODB_PRIMARY_URI || 'mongodb://localhost:27017/primarydb',
      { connectionName: 'primary' }
    ),
    // Fallback database connection
    MongooseModule.forRoot(
      process.env.MONGODB_FALLBACK_URI || 'mongodb://localhost:27017/fallbackdb',
      { connectionName: 'fallback' }
    ),
    UsersModule,
    AuthModule,
    TicketsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

