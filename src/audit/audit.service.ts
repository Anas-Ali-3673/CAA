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

    // Try to write to both databases
    const promises: Promise<any>[] = [];
    
    promises.push(
      this.primaryAuditModel.create(auditEntry).catch(error => {
        console.warn('Failed to write audit log to primary database:', error.message);
        return null;
      })
    );
    
    promises.push(
      this.fallbackAuditModel.create(auditEntry).catch(error => {
        console.warn('Failed to write audit log to fallback database:', error.message);
        return null;
      })
    );

    // Wait for at least one to succeed
    await Promise.allSettled(promises);
  }

  async getAuditLogs(): Promise<IAuditLog[]> {
    try {
      return await this.primaryAuditModel.find().populate('userId', 'name email').sort({ timestamp: -1 });
    } catch (error) {
      console.warn('Primary database failed for audit logs, using fallback:', error.message);
      return await this.fallbackAuditModel.find().populate('userId', 'name email').sort({ timestamp: -1 });
    }
  }
}