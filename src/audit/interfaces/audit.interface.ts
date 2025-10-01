export interface IAuditLog {
  _id: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  timestamp: Date;
}