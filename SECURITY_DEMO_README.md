# Security Demo - Support Ticket System

This NestJS application demonstrates three key security properties:

## 🔐 Security Properties Implemented

### 1. **Confidentiality via Access Control**
- **Role-based access control**: Admin and User roles
- **Resource-level authorization**: Users can only see/modify their own tickets
- **Admins have full access** to all tickets
- **Backend enforcement**: Access control is enforced at the service level, not just UI

### 2. **Availability via Two Databases**
- **Primary database**: Main MongoDB instance
- **Fallback database**: Secondary MongoDB instance
- **Automatic failover**: App switches to fallback when primary is unavailable
- **Manual toggle**: Admins can simulate primary database failure

### 3. **Accountability via Audit Logs**
- **Comprehensive logging**: All CRUD operations are logged
- **User tracking**: Who, what, when for every action
- **Append-only logs**: Audit entries cannot be modified
- **Admin-only access**: Only admins can view audit logs

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (running on default port 27017)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
JWT_SECRET=your-super-secret-jwt-key-here
MONGODB_PRIMARY_URI=mongodb://localhost:27017/primarydb
MONGODB_FALLBACK_URI=mongodb://localhost:27017/fallbackdb
PORT=3000
```

### 3. Start MongoDB
Ensure MongoDB is running on your system:
```bash
# On Windows (if installed as service)
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

### 4. Seed Admin Users
```bash
npm run seed:admin
```

This creates:
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

### 5. Start the Application
```bash
npm run start:dev
```

The API will be available at: `http://localhost:3000/api`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Register

### Tickets (Protected)
- `GET /api/tickets` - List tickets (filtered by role)
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket (access control applied)
- `PATCH /api/tickets/:id` - Update ticket (access control applied)
- `DELETE /api/tickets/:id` - Delete ticket (access control applied)

### Audit (Admin Only)
- `GET /api/audit/logs` - View audit logs
- `GET /api/audit/database/status` - Check database status
- `POST /api/audit/database/toggle` - Toggle primary database

## 🧪 Testing Security Properties

### 1. Test Confidentiality (Access Control)

**Login as User:**
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}'
```

**Create a ticket:**
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Issue","description":"Need help with something","priority":"medium"}'
```

**Login as Admin and verify you can see all tickets:**
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

curl -X GET http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Test Availability (Database Failover)

**Check database status:**
```bash
curl -X GET http://localhost:3000/api/audit/database/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Simulate primary database failure:**
```bash
curl -X POST http://localhost:3000/api/audit/database/toggle \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"down":true}'
```

**Test that app still works (now using fallback):**
```bash
curl -X GET http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Restore primary database:**
```bash
curl -X POST http://localhost:3000/api/audit/database/toggle \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"down":false}'
```

### 3. Test Accountability (Audit Logs)

**View audit logs (admin only):**
```bash
curl -X GET http://localhost:3000/api/audit/logs \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Try as regular user (should fail):**
```bash
curl -X GET http://localhost:3000/api/audit/logs \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

## 🔍 What Gets Logged

The audit system logs:
- **User logins/signups**
- **Ticket creation/updates/deletion**
- **Database status changes**
- **Failed access attempts**

Each log entry includes:
- User ID and role
- Action performed
- Resource affected
- Timestamp
- Additional details

## 🛡️ Security Features Demonstrated

1. **JWT Authentication** with role-based claims
2. **Input validation** using class-validator
3. **Access control** enforced at service layer
4. **Database redundancy** for high availability
5. **Comprehensive audit trail** for accountability
6. **Error handling** without information leakage

## 📝 Notes

- The fallback database is a separate MongoDB database, not just a replica
- Audit logs are stored in both databases for redundancy
- Access control is enforced in the service layer, not just the controller
- All sensitive operations are logged for accountability