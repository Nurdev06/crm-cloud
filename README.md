# retakeCRM — Wholesale Clothing Distribution CRM

retakeCRM is a modern, enterprise-grade cloud-native Customer Relationship Management (CRM) system tailored for wholesale ready-made clothing distribution companies. Built with a FastAPI backend and a React + TypeScript frontend, it orchestrates inventory, orders, logistics, support, and analytics.

---

## Quick Start Guide (Yangi dasturchilar uchun qo'llanma)

Agar siz loyihani birinchi marta ishga tushirayotgan bo'lsangiz, quyidagi qadamlarni ketma-ket bajaring:

### 1. Prerequisities (Talablar)
Kompyuteringizda quyidagilar o'rnatilgan bo'lishi kerak:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (konteynerlarni boshqarish uchun)
* [Git](https://git-scm.com/)

---

### 2. Environment Setup (Muhitni sozlash)
Loyiha bosh papkasida (`CRM/`) `.env` faylini yaratishingiz kerak. Buning uchun shablon fayldan nusxa oling:

```bash
cp .env.example .env
```

*(Eslatma: Docker uchun ko'rsatilgan default sozlamalar ishlaydi, qo'shimcha o'zgartirish shart emas).*

---

### 3. Build & Run Containers (Ishga tushirish)
Barcha xizmatlarni (PostgreSQL, Redis, FastAPI backend va React frontend) yig'ish va ishga tushirish uchun quyidagi buyruqni bering:

```bash
docker compose up --build
```

Konteynerlar to'liq yig'ilib, ishga tushguncha kuting. Barcha loglar terminalda ko'rinadi.

---

### 4. Create Tables & Seed Data (Ma'lumotlar bazasini to'ldirish)
Baza tuzilishini yaratish va uni test ma'lumotlari bilan to'ldirish uchun **alohida yangi terminal oynasini** oching va loyihaning bosh papkasida quyidagi buyruqni bering:

```bash
docker compose exec backend python seed.py
```

---

### 5. Access the Applications (Tizimga kirish)

Barcha sozlamalar muvaffaqiyatli bajarilgandan so'ng, brauzeringiz orqali quyidagi manzillarga kirishingiz mumkin:

*   **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
*   **Backend API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

#### Demo Tizimga Kirish Ma'lumotlari (Credentials)
Barcha seeded foydalanuvchilar uchun parol: **`Admin123!`**

*   **Super Admin:** `admin@retakecrm.com`
*   **Sales Manager:** `sales.manager@retakecrm.com`
*   **Sales Rep:** `sales.rep@retakecrm.com`
*   **Warehouse Manager:** `warehouse@retakecrm.com`
*   **Logistics Coordinator:** `logistics@retakecrm.com`
*   **Customer Support Agent:** `support@retakecrm.com`
*   **Finance Manager:** `finance@retakecrm.com`

---

## Tech Stack (Texnologiyalar)

*   **Backend:** FastAPI (Python 3.12), SQLAlchemy (Async), PostgreSQL, Redis, Celery (seeding)
*   **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, Framer Motion, TanStack Query, Recharts
*   **Infrastructure:** Docker, Docker Compose, Terraform, Kubernetes manifests, GitHub Actions
