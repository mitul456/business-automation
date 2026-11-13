# OmniFlow SaaS — লোকাল পিসি MySQL ডাটাবেজ সেটআপ ও কনফিগারেশন গাইড
(Local PC MySQL Database Connection, Configuration & Troubleshooting Guide)

---

## ১. ভূমিকা (Overview)
এই নির্দেশিকাটির সাহায্যে আপনি আপনার লোকাল উইন্ডোজ/লিনাক্স/ম্যাক পিসিতে **MySQL Server** সেটআপ করে **OmniFlow SaaS** প্ল্যাটফর্মের ডাটাবেজ কোনো ধরনের Authentication Error ছাড়াই সফলভাবে চালু ও সংযুক্ত করতে পারবেন।

---

## ২. লোকাল পিসিতে MySQL সার্ভার সেটআপের বিকল্প পদ্ধতিসমূহ

আপনি নিচের যেকোনো একটি সুবিধাজনক উপায়ে MySQL সার্ভার চালাতে পারেন:

### পদ্ধতি ক: XAMPP ব্যবহার করে (সবচেয়ে সহজ ও জনপ্রিয়)
1. **XAMPP** ডাউনলোড ও ইন্সটল করুন: [https://www.apachefriends.org](https://www.apachefriends.org)
2. XAMPP Control Panel ওপেন করে **MySQL** মডিউলের পাশে **Start** বাটনে ক্লিক করুন (Port: `3306`)।
3. ব্রাউজারে `http://localhost/phpmyadmin` ওপেন করুন।
4. মেনু থেকে **User accounts** &gt; **Add user account**-এ যান।
5. ইউজারনেম দিন: `omniflow`, হোস্ট: `localhost`, পাসওয়ার্ড: `omniflow_pass`।
6. **Database for user account** সেকশনে "Create database with same name and grant all privileges" চেক করুন অথবা নিচের SQL কোয়েরি চালান।

### পদ্ধতি খ: Laragon ব্যবহার করে
1. **Laragon** ওপেন করে **Start All** দিন।
2. Database (HeidiSQL) ওপেন করে রুট বা কাস্টম ইউজার দিয়ে কানেক্ট করুন।

### পদ্ধতি গ: MySQL Official Installer বা Workbench ব্যবহার করে
1. **MySQL Server 8.0+** এবং **MySQL Workbench** ইন্সটল করুন।
2. ইন্সটলেশন করার সময় Authentication Method হিসেবে **Legacy Authentication Method (mysql_native_password)** সিলেক্ট করা নিরাপদ, অথবা নিচের অল্টার কমান্ড চালান।

---

## ৩. ডাটাবেজ ও ইউজার তৈরি করার এক্সাক্ট SQL কমান্ড (Step-by-Step)

যেকোনো MySQL CLI, Workbench, phpMyAdmin SQL ট্যাব বা Laragon টার্মিনালে নিচের কোয়েরিগুলো হুবহু রান করুন:

```sql
-- ১. ডাটাবেজ তৈরি করুন (UTF-8 বাংলা ও ইমোজি সাপোর্টের জন্য utf8mb4)
CREATE DATABASE IF NOT EXISTS omniflow_db
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- ২. নতুন ডেডিকেটেড ইউজার তৈরি করুন (Native Password দিয়ে)
CREATE USER IF NOT EXISTS 'omniflow'@'localhost' IDENTIFIED BY 'omniflow_pass';

-- ৩. ইউজারকে omniflow_db ডাটাবেজের ওপর সর্বময় ক্ষমতা (ALL PRIVILEGES) প্রদান করুন
GRANT ALL PRIVILEGES ON omniflow_db.* TO 'omniflow'@'localhost';

-- ৪. প্রিভিলেজ ক্যাশ রিফ্রেশ করুন
FLUSH PRIVILEGES;
```

> **টিপস (রুট ইউজার ব্যবহার করতে চাইলে):**
> আপনি যদি আলাদা ইউজার না বানিয়ে ডিফল্ট `root` ইউজার ব্যবহার করতে চান, তবে আপনার `.env` ফাইলে নিচের মতো দিতে পারেন:
> - যদি রুটের কোনো পাসওয়ার্ড না থাকে: `DATABASE_URL="mysql://root:@localhost:3306/omniflow_db"`
> - যদি রুটের পাসওয়ার্ড থাকে: `DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/omniflow_db"`

---

## ৪. প্রজেক্টের `.env` কনফিগারেশন

আপনার প্রজেক্টের রুট ডিরেক্টরি `Social_Automation_saas/.env` ফাইলে ডাটাবেজ কানেকশন স্ট্রিং নিচের নিয়মে সেট করুন:

```env
# ------------------------------------------------------------------------------
# DATABASE CONNECTION URL (MySQL 8.0 / MariaDB 10.4+)
# Format: mysql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE_NAME>
# ------------------------------------------------------------------------------
DATABASE_URL=mysql://omniflow:omniflow_pass@localhost:3306/omniflow_db
```

---

## ৫. Prisma Schema Sync ও Migration নির্দেশিকা

ডাটাবেজ ও `.env` প্রস্তুত হয়ে গেলে টার্মিনাল (PowerShell) ওপেন করে নিচের কমান্ডগুলো চালান:

### ধাপ ১: Prisma Client জেনারেট করুন
```powershell
pnpm --filter @omniflow/database prisma generate
```

### ধাপ ২: ডাটাবেজে টেবিল ও রিলেশন তৈরি করুন (Push Schema)
লোকাল পিসিতে সবচেয়ে দ্রুত এবং নিরাপদভাবে টেবিল তৈরি করার কমান্ড:
```powershell
pnpm --filter @omniflow/database prisma db push
```
*(এটি স্বয়ংক্রিয়ভাবে `User`, `Tenant`, `PaymentMethodConfig`, `CreditTopupRequest`, `DynamicApiConfig`, `Order`, `Message` ইত্যাদি সকল টেবিল তৈরি করে দেবে)*

### ধাপ ৩: ডিফল্ট সিড ডাটা লোড করুন (Seed Database)
```powershell
pnpm --filter @omniflow/database prisma db seed
```

### ধাপ ৪: ডাটা ভিজ্যুয়াল দেখতে চান? (Prisma Studio)
```powershell
pnpm --filter @omniflow/database prisma studio
```
ব্রাউজারে `http://localhost:5555` এ আপনার সকল টেবিল ও ডাটা দেখতে পাবেন।

---

## ৬. সচরাচর সমস্যা ও সমাধান (Troubleshooting)

### সমস্যা ১: `P1000: Authentication failed against database server`
- **কারণ:** ইউজারনেম বা পাসওয়ার্ড ভুল হয়েছে অথবা ইউজারের পারমিশন দেওয়া হয়নি।
- **সমাধান:** 
  1. নিশ্চিত করুন MySQL চালু রয়েছে।
  2. MySQL টার্মিনালে রান করুন:
     ```sql
     ALTER USER 'omniflow'@'localhost' IDENTIFIED WITH mysql_native_password BY 'omniflow_pass';
     FLUSH PRIVILEGES;
     ```

### সমস্যা ২: `P1001: Can't reach database server at localhost:3306`
- **কারণ:** MySQL সার্ভিস চালু নেই অথবা পোর্ট ৩৩০৬ অন্য কোনো সফটওয়্যার দখল করে রেখেছে।
- **সমাধান:** 
  1. XAMPP বা Services থেকে MySQL Start করুন।
  2. পোর্টে কোনো কনফ্লিক্ট থাকলে `.env`-এ সঠিক পোর্ট দিন (যেমন `3307`)।

### সমস্যা ৩: বাংলা লেখা বা ইমোজি ঠিকমতো সেভ না হওয়া (Question mark `???` দেখানো)
- **সমাধান:** ডাটাবেজ অবশ্যই `utf8mb4` দিয়ে তৈরি হতে হবে:
  ```sql
  ALTER DATABASE omniflow_db CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
  ```

---

## ৭. Local Development বনাম Live cPanel/VPS ডাটাবেজের পার্থক্য

| প্যারামিটার | Local Development (আপনার পিসি) | Live cPanel / Cloud VPS |
| :--- | :--- | :--- |
| **Host** | `localhost` অথবা `127.0.0.1` | `localhost` (cPanel) অথবা ক্লাউড আইপি (যেমন AWS RDS) |
| **User Name** | `omniflow` অথবা `root` | `cpaneluser_omni` (cPanel প্রিপিক্সযুক্ত) |
| **Database Name**| `omniflow_db` | `cpaneluser_omniflow` |
| **Password** | সাধারণ পাসওয়ার্ড (যেমন: `omniflow_pass`) | শক্তিশালী হ্যাশড পাসওয়ার্ড (১৬+ অক্ষর) |
| **SSL Connection**| প্রয়োজন নেই (`sslmode=prefer`) | প্রোডাকশনে বাধ্যতামূলক (`sslmode=require` / `sslaccept=strict`) |
| **Schema Update**| `prisma db push` (দ্রুত ডেভেলপমেন্টের জন্য) | `prisma migrate deploy` (জিরো ডাউনটাইম মাইগ্রেশন) |

---
*ডকুমেন্টটি সফলভাবে কনফিগারেশনের জন্য সংকলিত। যেকোনো প্রয়োজনে প্রজেক্ট রুট ফোল্ডারের `documents.html` ফাইলটি ব্রাউজারে ওপেন করুন।*
