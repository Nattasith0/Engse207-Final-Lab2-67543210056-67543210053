# INDIVIDUAL_REPORT_67543210056-7.md

## ข้อมูลผู้จัดทำ
- ชื่อ-นามสกุล: นายณัฐสิทธิ์ มะโนชัย
- รหัสนักศึกษา: 67543210056-7
- รายวิชา: ENGSE207 Software Architecture
- งาน: Final Lab Set 2 — Microservices Scale-Up + Cloud Deployment (Railway)

---

## ขอบเขตงานที่รับผิดชอบ

รับผิดชอบ **Auth Service** ทั้งหมด ประกอบด้วย

- เพิ่ม `POST /api/auth/register` สำหรับสมัครสมาชิกใหม่
- ปรับ `auth-service/src/db/db.js` ให้ใช้ `DATABASE_URL` แทนการตั้งค่าแบบ host/port แยก
- ปรับ `auth-service/src/middleware/jwtUtils.js` ให้ใช้ `JWT_SECRET` ร่วมกันทุก service
- เขียน `auth-service/init.sql` สำหรับ auth-db โดยเฉพาะ พร้อม seed admin user
- Deploy `auth-service` + `auth-db` บน Railway

---

## สิ่งที่ได้ดำเนินการด้วยตนเอง

- เขียน Register endpoint ใน `auth-service/src/routes/auth.js` ครบ ทั้งการตรวจสอบ input, เช็ค duplicate user, hash password ด้วย bcryptjs และ return response ที่เหมาะสม
- แก้ไข `db.js` จากการใช้ `host/port/database` แยกกันมาเป็น `connectionString` เพื่อให้รองรับ Railway DATABASE_URL
- แก้ไข `jwtUtils.js` ให้ default secret เป็น `dev-shared-secret` ตรงกับทุก service
- แก้ไข `index.js` ให้ใช้ `db.query()` แทน `pool.query()` เพื่อให้สอดคล้องกับ db.js ที่แก้ใหม่
- ทดสอบ Register และ Login flow ด้วย Postman จนผ่านครบ

---

## ปัญหาที่พบและวิธีการแก้ไข

| ปัญหา | วิธีแก้ |
|---|---|
| `bcrypt` บน Windows ไม่ทำงานใน Docker (Exec format error) | เปลี่ยนจาก `bcrypt` เป็น `bcryptjs` ซึ่งเป็น pure JavaScript ไม่ต้องคอมไพล์ |
| `db is not defined` ใน register route | เพราะ `db.js` export `{ pool }` แต่ route ใช้ `db.query()` แก้โดยเปลี่ยน export เป็น `module.exports = { query }` |
| JWT_SECRET ไม่ตรงกัน ทำให้ task-service verify token ไม่ผ่าน | แก้ค่า default ใน `jwtUtils.js` ของทุก service ให้เหมือนกัน และตั้งค่าใน `docker-compose.yml` ให้ครบ |
| `const router` ประกาศ 2 ครั้งใน auth.js | ลบบรรทัดที่ซ้ำออก และจัดโครงสร้างไฟล์ใหม่ให้สะอาด |

---

## สิ่งที่ได้เรียนรู้จากงานนี้

- **Database-per-Service Pattern** ทำให้แต่ละ service เป็นอิสระต่อกัน ไม่มี Foreign Key ข้าม database ต้องใช้ `user_id` เป็น logical reference แทน
- **JWT เป็น Stateless** ทำให้ Task Service และ User Service ไม่ต้อง query auth-db เลย แค่ verify token ด้วย `JWT_SECRET` เดียวกันก็รู้ว่าใครคือใคร
- **bcryptjs vs bcrypt** — `bcrypt` ต้องคอมไพล์ native code ทำให้มีปัญหาข้าม platform แต่ `bcryptjs` เป็น pure JavaScript ใช้ได้ทุก environment
- **Docker healthcheck** สำคัญมากสำหรับการรอให้ DB พร้อมก่อน service start โดยใช้ `condition: service_healthy`

---

## แนวทางการพัฒนาต่อไป

- เพิ่ม rate limiting สำหรับ register endpoint เพื่อป้องกัน spam
- เพิ่ม email verification หลังสมัครสมาชิก
- เพิ่ม refresh token mechanism เพื่อความปลอดภัย
- ทำ cascade delete เมื่อลบ user เพื่อจัดการ orphan records ใน task-db และ user-db