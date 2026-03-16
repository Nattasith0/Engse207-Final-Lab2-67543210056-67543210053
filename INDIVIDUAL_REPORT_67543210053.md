# INDIVIDUAL_REPORT_67543210053-4.md

## ข้อมูลผู้จัดทำ
- ชื่อ-นามสกุล: นายฐิติภัทร์ ชุ่มมา
- รหัสนักศึกษา: 67543210053-4
- รายวิชา: ENGSE207 Software Architecture
- งาน: Final Lab Set 2 — Microservices Scale-Up + Cloud Deployment (Railway)

---

## ขอบเขตงานที่รับผิดชอบ

รับผิดชอบ **User Service** และ **Task Service** ทั้งหมด ประกอบด้วย

- สร้าง `user-service` ใหม่ทั้งหมด พร้อม endpoints `GET /api/users/me`, `PUT /api/users/me`, `GET /api/users` (admin only)
- เขียน `user-service/init.sql` สำหรับตาราง `user_profiles`
- ปรับ `task-service` ให้ใช้ `task-db` แยก และแก้ไข `db.js` ให้ใช้ `DATABASE_URL`
- แก้ไข `task-service/src/routes/tasks.js` ให้รองรับ Database-per-Service (ไม่ JOIN ข้าม DB)
- Deploy `user-service` + `user-db` และ `task-service` + `task-db` บน Railway
- ตั้งค่า Gateway Strategy สำหรับ Cloud

---

## สิ่งที่ได้ดำเนินการด้วยตนเอง

- สร้าง `user-service` ใหม่ทั้งหมดตั้งแต่ `package.json`, `Dockerfile`, `db.js`, `authMiddleware.js` จนถึง `routes/users.js`
- เขียน logic auto-create profile เมื่อ user เรียก `GET /api/users/me` ครั้งแรก โดยใช้ข้อมูลจาก JWT payload
- แก้ไข `task-service/src/routes/tasks.js` ลบ `JOIN users` ออก เพราะ users อยู่คนละ database แล้ว
- แก้ไข `task-service/src/middleware/authMiddleware.js` ให้ไม่พึ่ง log-service
- ทดสอบ User Service ด้วย Postman ครบทุก endpoint

---

## ปัญหาที่พบและวิธีการแก้ไข

| ปัญหา | วิธีแก้ |
|---|---|
| `user-service/Dockerfile` ว่างเปล่า ทำให้ build ไม่ได้ | เปิดไฟล์และวางโค้ด Dockerfile ที่ถูกต้องลงไป |
| `task-service/routes/tasks.js` ใช้ `JOIN users` ข้าม database | ลบ JOIN ออก และดึงเฉพาะข้อมูลจาก tasks table ของ task-db อย่างเดียว |
| `npm ci` fail เพราะ `package-lock.json` ไม่ sync | เปลี่ยน Dockerfile จาก `npm ci` เป็น `npm install` และลบ lock file เก่าออก |
| user-service `authMiddleware.js` เรียก log-service ที่ไม่มีแล้ว | แก้ middleware ให้ใช้ `jwt.verify()` โดยตรง ไม่ส่ง log ไป log-service |

---

## สิ่งที่ได้เรียนรู้จากงานนี้

- **Database-per-Service** ทำให้ไม่สามารถ JOIN ข้าม database ได้ ต้องใช้ logical reference ผ่าน `user_id` และรับข้อมูลเพิ่มเติมจาก JWT payload แทน
- **Auto-create Profile Pattern** — เมื่อ user ใหม่ login ครั้งแรกและเรียก `/api/users/me` User Service จะสร้าง profile อัตโนมัติจาก JWT โดยไม่ต้องรอ event จาก Auth Service
- **Stateless JWT** ทำให้ User Service ไม่ต้องคุยกับ Auth Service เลย แค่ verify token ก็รู้ `user_id`, `username`, `email`, `role` ได้ทันที
- **CORS** สำคัญมากเมื่อ Frontend และ Backend อยู่คนละ port/domain ต้องเพิ่ม `cors()` middleware ในทุก service

---

## แนวทางการพัฒนาต่อไป

- เพิ่ม pagination สำหรับ `GET /api/users` เพื่อรองรับผู้ใช้จำนวนมาก
- เพิ่ม `DELETE /api/users/:id` สำหรับ admin พร้อม cascade delete ใน task-db
- เพิ่ม event-driven sync ระหว่าง Auth Service และ User Service เช่น เมื่อ register สำเร็จให้สร้าง profile ทันที แทนที่จะ lazy create
- เพิ่ม search และ filter สำหรับ task list