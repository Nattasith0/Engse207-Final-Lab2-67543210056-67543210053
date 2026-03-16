# TEAM_SPLIT.md

## ข้อมูลกลุ่ม
- รายวิชา: ENGSE207 Software Architecture
- งาน: Final Lab Set 2 — Microservices Scale-Up + Cloud Deployment (Railway)

## รายชื่อสมาชิก
| รหัสนักศึกษา | ชื่อ-นามสกุล |
|---|---|
| 67543210056-7 | นายณัฐสิทธิ์ มะโนชัย |
| 67543210053-4 | นายฐิติภัทร์ ชุ่มมา |

---

## การแบ่งงานหลัก

### สมาชิกคนที่ 1: นายณัฐสิทธิ์ มะโนชัย (67543210056-7)
รับผิดชอบงานหลักดังต่อไปนี้
- **Auth Service** — เพิ่ม `POST /api/auth/register` สำหรับสมัครสมาชิกใหม่
- แยก `auth-db` ออกเป็น database เฉพาะ (Database-per-Service Pattern)
- เขียน `auth-service/init.sql` พร้อม seed admin user
- ปรับ `auth-service/src/db/db.js` ให้ใช้ `DATABASE_URL`
- ปรับ `auth-service/src/middleware/jwtUtils.js` ให้ใช้ `JWT_SECRET` ร่วมกัน
- Deploy `auth-service` + `auth-db` บน Railway
- Branch: `feature/auth-register`

### สมาชิกคนที่ 2: นายฐิติภัทร์ ชุ่มมา (67543210053-4)
รับผิดชอบงานหลักดังต่อไปนี้
- **User Service** — สร้างใหม่ทั้งหมด ประกอบด้วย `GET /api/users/me`, `PUT /api/users/me`, `GET /api/users` (admin only)
- **Task Service** — ปรับให้ใช้ `task-db` แยก และแก้ไข db.js ให้ใช้ `DATABASE_URL`
- เขียน `user-service/init.sql` สำหรับตาราง `user_profiles`
- แก้ไข `task-service/src/routes/tasks.js` ให้รองรับ Database-per-Service
- Deploy `user-service` + `user-db` และ `task-service` + `task-db` บน Railway
- ตั้งค่า Gateway Strategy สำหรับ Cloud
- Branch: `feature/user-service`

---

## งานที่ดำเนินการร่วมกัน
- อัปเดต `docker-compose.yml` ให้รองรับ 3 services + 3 databases พร้อม healthcheck
- เพิ่ม `frontend/` พร้อมหน้า Register, Login, Profile และ Log Dashboard
- ทดสอบระบบแบบ end-to-end ด้วย Postman และ Browser
- จัดทำ Screenshots ครบ 12 ภาพ
- จัดทำ Architecture Diagram สำหรับ README
- Debug ปัญหา JWT_SECRET และ Database connection ร่วมกัน

---

## เหตุผลในการแบ่งงาน
แบ่งตาม **Service Boundary** ของระบบ โดยคนที่ 1 รับผิดชอบ Auth ซึ่งเป็นหัวใจของระบบ Authentication และ JWT ส่วนคนที่ 2 รับผิดชอบ User และ Task ซึ่งเป็น Business Logic หลักของระบบ การแบ่งแบบนี้สอดคล้องกับ Microservices Pattern ที่แต่ละคนเป็นเจ้าของ service ของตนเองอย่างชัดเจน

## สรุปการเชื่อมโยงงานของสมาชิก
งานของสมาชิกทั้งสองเชื่อมต่อกันผ่าน **JWT Token** โดย Auth Service ของคนที่ 1 ออก token ให้ และ Task/User Service ของคนที่ 2 ต้อง verify token ด้วย `JWT_SECRET` ค่าเดียวกัน นอกจากนี้ยังเชื่อมโยงผ่าน `user_id` ที่เป็น logical reference ระหว่าง 3 databases