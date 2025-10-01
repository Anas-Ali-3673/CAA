import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog, AuditLogSchema } from './schema/audit.schema';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }], 'primary'),
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }], 'fallback'),
  ],
  controllers: [AuditController],
  providers: [AuditService, DatabaseService],
  exports: [AuditService],
})
export class AuditModule {}