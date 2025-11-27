# FiberTrace Backend Setup - Real Database Integration

## Overview
FiberTrace now uses **real backend API** (no more test credentials). The backend connects to PostgreSQL for all data persistence.

---

## 🚀 Quick Start (Development)

### 1. Database Setup
```bash
# Option A: Use Replit Database (Easiest)
# The database is already configured in Replit environment

# Option B: Local PostgreSQL
sudo service postgresql start
createdb fibertrace
psql fibertrace < backend/schema.sql
```

### 2. Start Backend Server
```bash
cd /home/runner/workspace/backend
npm install
npm start
# Server runs on http://localhost:5001
```

### 3. Start Mobile App
```bash
# In separate terminal
cd /home/runner/workspace
npm start
# App connects to http://localhost:5001/api
```

---

## 📊 Database Schema

**15 Core Tables:**
1. **users** - Login & authentication
2. **nodes** - Network nodes (OLT, Splitters, FAT, ATB)
3. **closures** - Closure management (FAT, ATB, Dome, Inline, etc.)
4. **splitters** - Fiber splitter configurations
5. **fiber_lines** - Cables between points
6. **fat_ports** - Customer drops
7. **jobs** - Work orders & tasks
8. **job_actions** - Job progress logging
9. **daily_reports** - Technician reports
10. **power_readings** - Power monitoring data
11. **gps_logs** - Location tracking
12. **meter_readings** - Bluetooth device data
13. **map_tiles** - Offline map cache
14. **login_history** - Authentication logs
15. **asset_updates** - Change tracking

---

## 🔐 Authentication Flow (Real)

### Login
```
POST /api/auth/login
Body: { email: "user@example.com", password_hash: "password" }

Response (Success):
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Technician",
    "role": "Technician"
  }
}

Response (Error 401):
{ "error": "Invalid credentials" }

Response (Error 404):
{ "error": "User not found" }
```

### Register
```
POST /api/auth/register
Body: { full_name: "John", email: "john@example.com", password_hash: "password" }

Response:
{
  "success": true,
  "user": { id, email, full_name, role }
}
```

---

## 🎯 API Endpoints (All Implemented)

### Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `POST /api/auth/password-reset` - Password recovery

### Nodes
- `GET /api/nodes` - List all nodes
- `POST /api/nodes` - Create node
- `PUT /api/nodes/:id` - Update node
- `DELETE /api/nodes/:id` - Delete node

### Closures
- `GET /api/closures` - List all closures
- `POST /api/closures` - Create closure
- `PUT /api/closures/:id` - Update closure
- `DELETE /api/closures/:id` - Delete closure

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job status

### Customers/ONT
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

### Reports & Analytics
- `GET /api/reports` - Daily reports
- `POST /api/reports` - Create report
- `GET /api/analytics` - Performance metrics

---

## 🔧 Test Users (Database)

Before using the app, create users in the database:

```sql
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Admin User', 'admin@fibertrace.app', 'admin123456', 'admin'),
('John Technician', 'john@fibertrace.app', 'tech123456', 'technician'),
('Jane Field', 'jane@fibertrace.app', 'field123456', 'technician');
```

Then login with any of these credentials in the app.

---

## 🌐 Production Deployment

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:5432/fibertrace
PORT=5001
NODE_ENV=production
API_KEY=your-secret-key
```

### Deploy to Production
```bash
# Build
npm run build

# Run
npm start
```

---

## 🛠️ Troubleshooting

### "Connection refused"
- ✅ Backend server not running: `cd backend && npm start`
- ✅ Wrong database URL: Check DATABASE_URL env var
- ✅ PostgreSQL not running: `sudo service postgresql start`

### "Invalid credentials"
- ✅ User doesn't exist in database
- ✅ Password incorrect
- ✅ Use test users created above

### "Network error"
- ✅ Backend server not accessible
- ✅ Check API URL: Should be `http://localhost:5001`
- ✅ Firewall blocking port 5001

---

## 📝 Add Test Data (Optional)

```sql
-- Add test nodes
INSERT INTO nodes (node_name, node_type, latitude, longitude, power_status, power_rating) VALUES
('OLT-Central', 'OLT', 40.7128, -74.0060, 'active', 100),
('Splitter-Main', 'Splitter', 40.7150, -74.0070, 'active', 50);

-- Add test closure
INSERT INTO closures (closure_name, closure_type, latitude, longitude, capacity_total, capacity_used) VALUES
('FAT-01', 'FAT', 40.7160, -74.0080, 48, 12);

-- Add test customer
INSERT INTO fat_ports (closure_id, port_number, status, customer_name, customer_phone) VALUES
(1, 1, 'active', 'Acme Corp', '555-1234');
```

---

## ✅ Verification Checklist

- [ ] Backend server running on port 5001
- [ ] Database connected and schema applied
- [ ] Test users created in database
- [ ] Mobile app connects to http://localhost:5001
- [ ] Login works with real credentials
- [ ] Data persists in database
- [ ] All endpoints responding correctly

---

**Status:** Backend is **fully integrated with real PostgreSQL database**. No more test credentials or mock data.

