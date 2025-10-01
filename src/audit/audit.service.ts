import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schema/audit.schema';
import { IAuditLog } from './interfaces/audit.interface';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name, 'primary') private primaryAuditModel: Model<IAuditLog>,
    @InjectModel(AuditLog.name, 'fallback') private fallbackAuditModel: Model<IAuditLog>,
  ) {}

  async log(
    userId: string,
    userRole: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any,
  ): Promise<void> {
    const auditEntry = {
      userId,
      userRole,
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date(),
    };

    try {
      await this.primaryAuditModel.create(auditEntry);
    } catch (error) {
      await this.fallbackAuditModel.create(auditEntry);
    }
  }

  async getAuditLogs(): Promise<IAuditLog[]> {
    try {
      return await this.primaryAuditModel.find().populate('userId', 'name email').sort({ timestamp: -1 });
    } catch (error) {
      return await this.fallbackAuditModel.find().populate('userId', 'name email').sort({ timestamp: -1 });
    }
  }
}