# ENGSE207 Software Architecture
## Final Lab Set 2 — Microservices Scale-Up + Cloud Deployment (Railway)

---

## 1. ข้อมูลรายวิชาและสมาชิก

**รายวิชา:** ENGSE207 Software Architecture
**ชื่องาน:** Final Lab — ชุดที่ 2: Microservices Scale-Up + Cloud Deployment (Railway)

**สมาชิกในกลุ่ม**
| รหัสนักศึกษา | ชื่อ-นามสกุล | หน้าที่ |
|---|---|---|
| 67543210056-7 | นายณัฐสิทธิ์ มะโนชัย | Auth Service + Deploy Auth |
| 67543210053-4 | นายฐิติภัทร์ ชุ่มมา | User Service + Task Service + Deploy |

---

## 2. Service URLs บน Railway

| Service | URL |
|---|---|
| Frontend | `https://frontend-production-47ba.up.railway.app/index.html` |
| Auth Service | `https://auth-service-production-d7a0.up.railway.app` |
| Task Service | `https://task-service-production-cbc1.up.railway.app` |
| User Service | `https://user-service-production-f14a.up.railway.app` |

> แทนที่ `[...]` ด้วย URL จริงจาก Railway หลัง Deploy

---

## 3. Project Overview

Set 2 ต่อยอดจาก Set 1 โดย

- ขยายจาก 2 services เป็น **3 services** (Auth, Task, User)
- เปลี่ยนจาก Shared Database เป็น **Database-per-Service** (3 databases แยกกัน)
- เพิ่ม **Register API** ใน Auth Service
- สร้าง **User Service** ใหม่สำหรับจัดการ profile
- ลบ Nginx และ Log Service ออก เพราะ Railway มี URL ให้แต่ละ service อยู่แล้ว
- Deploy ทุก service บน **Railway Cloud**

---

## 4. Architecture Diagram (Cloud)

```text
Internet / Browser / Postman
          │
          ├──► https://[AUTH_URL]     → auth-service (PORT 3001)
          │                                    │
          │                               auth-db (PostgreSQL)
          │                               users, logs
          │
          ├──► https://[TASK_URL]     → task-service (PORT 3002)
          │                                    │
          │                               task-db (PostgreSQL)
          │                               tasks, logs
          │
          ├──► https://[USER_URL]     → user-service (PORT 3003)
          │                                    │
          │                               user-db (PostgreSQL)
          │                               user_profiles, logs
          │
          └──► https://[FRONTEND_URL] → frontend (nginx)

JWT_SECRET ใช้ร่วมกันทุก service
user_id ใช้เป็น logical reference (ไม่มี FK ข้าม DB)
```

---

## 5. Services และ Databases

### Services
| Service | Port | หน้าที่ |
|---|---|---|
| auth-service | 3001 | Register, Login, Verify JWT |
| task-service | 3002 | CRUD Tasks + JWT Auth |
| user-service | 3003 | Profile Management + JWT Auth |
| frontend | 8080 | Web UI |

### Databases
| Database | ตาราง | เก็บข้อมูล |
|---|---|---|
| auth-db | users, logs | username, email, password_hash, role |
| task-db | tasks, logs | user_id, title, description, status, priority |
| user-db | user_profiles, logs | user_id, display_name, bio, avatar_url |

---

## 6. API Endpoints

### Auth Service
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก | ❌ |
| POST | `/api/auth/login` | เข้าสู่ระบบ | ❌ |
| GET | `/api/auth/me` | ดูข้อมูลตัวเอง | ✅ JWT |
| GET | `/api/auth/verify` | ตรวจสอบ token | ✅ JWT |
| GET | `/api/auth/health` | Health check | ❌ |

### Task Service
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/tasks` | ดู tasks ของตัวเอง | ✅ JWT |
| POST | `/api/tasks` | สร้าง task | ✅ JWT |
| PUT | `/api/tasks/:id` | แก้ไข task | ✅ JWT |
| DELETE | `/api/tasks/:id` | ลบ task | ✅ JWT |
| GET | `/api/tasks/health` | Health check | ❌ |

### User Service
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/users/me` | ดู profile ตัวเอง | ✅ JWT |
| PUT | `/api/users/me` | แก้ไข profile | ✅ JWT |
| GET | `/api/users` | ดูผู้ใช้ทั้งหมด | ✅ JWT + Admin |
| GET | `/api/users/health` | Health check | ❌ |

---

## 7. Gateway Strategy

Set 2 ใช้ **Direct Service URL** แทน API Gateway เพราะ Railway ให้ URL แยกให้แต่ละ service อยู่แล้ว Client เรียกแต่ละ service โดยตรง ซึ่งเหมาะสมสำหรับการ Deploy บน Cloud ที่แต่ละ service มี domain เป็นของตัวเอง

**ข้อดี:** ง่าย ไม่มี single point of failure, deploy แยกกันได้
**ข้อเสีย:** Client ต้องรู้ URL ของทุก service, ไม่มี centralized routing

---

## 8. วิธีรัน Local ด้วย Docker Compose

```bash
# 1. Clone repo
git clone https://github.com/Nattasith0/engse207-final-lab2-67543210056-67543210053.git
cd engse207-final-lab2-67543210056-67543210053

# 2. สร้าง .env
cp .env.example .env

# 3. รัน
docker compose up --build

# 4. เปิดหน้าเว็บ
# http://localhost:8080

# 5. ทดสอบ Health Check
curl http://localhost:3001/api/auth/health
curl http://localhost:3002/api/tasks/health
curl http://localhost:3003/api/users/health
```

---

## 9. วิธี Deploy บน Railway

1. ไปที่ [railway.app](https://railway.app) → New Project
2. สร้าง **PostgreSQL** สำหรับแต่ละ service (auth-db, task-db, user-db)
3. สร้าง **Service จาก GitHub** → เลือก repo → ตั้ง Root Directory เป็น `auth-service/`, `task-service/`, `user-service/`
4. ตั้ง **Environment Variables** ทุก service:

```
DATABASE_URL = (จาก Railway PostgreSQL)
JWT_SECRET   = engse207-super-secret-change-in-production-abc123
PORT         = 3001 / 3002 / 3003
```

---

## 10. Environment Variables

| Variable | Description | ตัวอย่าง |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret สำหรับ sign/verify JWT (ต้องเหมือนกันทุก service) | `engse207-super-secret-...` |
| `JWT_EXPIRES_IN` | อายุ token | `1h` |
| `PORT` | Port ที่ service รัน | `3001` / `3002` / `3003` |

---

## 11. วิธีทดสอบด้วย curl

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"123456"}'

# Login → เก็บ token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Auth Me
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get Profile (auto-create ครั้งแรก)
curl http://localhost:3003/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# Update Profile
curl -X PUT http://localhost:3003/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"display_name":"Test User","bio":"Hello Set 2"}'

# Create Task
curl -X POST http://localhost:3002/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","status":"TODO","priority":"high"}'

# Get Tasks
curl http://localhost:3002/api/tasks \
  -H "Authorization: Bearer $TOKEN"

# Test 401 — ไม่มี Token
curl http://localhost:3002/api/tasks

# Test 403 — Member เข้า Admin endpoint
curl http://localhost:3003/api/users \
  -H "Authorization: Bearer $TOKEN"

# Admin Login
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lab.local","password":"adminpass"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Admin — ดูผู้ใช้ทั้งหมด
curl http://localhost:3003/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 12. Screenshots

| ไฟล์ | รายละเอียด |
|---|---|
| `01_register_success.png` | Register สำเร็จ 201 |
| `02_login_success.png` | Login ได้ token |
| `03_auth_me.png` | GET /api/auth/me |
| `04_task_create.png` | สร้าง task สำเร็จ |
| `05_task_list.png` | ดูรายการ tasks |
| `06_task_update.png` | แก้ไข task |
| `07_task_delete.png` | ลบ task |
| `08_profile_get.png` | GET /api/users/me |
| `09_profile_update.png` | PUT /api/users/me |
| `10_member_forbidden_403.png` | Member เข้า /api/users → 403 |
| `11_admin_users_success.png` | Admin เข้า /api/users → 200 |
| `12_readme_architecture.png` | Architecture diagram |

---

## 13. Known Limitations

- ไม่มี Foreign Key ข้าม database — `user_id` ใน task-db และ user-db เป็น **logical reference** ไปยัง auth-db
- ถ้าลบ user ใน auth-db ข้อมูลใน task-db และ user-db จะยังคงอยู่ (orphan records)
- ไม่มี API Gateway รวม — client ต้องเรียกแต่ละ service URL โดยตรง
- Log ถูกบันทึกใน `logs` table ของแต่ละ database ไม่มี centralized logging

---

## 14. การแบ่งงานของทีม

รายละเอียดการแบ่งงานอยู่ในไฟล์ `TEAM_SPLIT.md`
รายงานรายบุคคลอยู่ในไฟล์
- `INDIVIDUAL_REPORT_67543210056-7.md`
- `INDIVIDUAL_REPORT_67543210053-4.md`