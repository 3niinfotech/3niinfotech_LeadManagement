# Lead Management CRM (VisaERP)

Enterprise multi-tenant Education ERP + CRM: Lead → Enquiry → Student → Visa lifecycle, with RBAC, audit logs, and a generic Master Data engine (W1/W2).

**Repository:** https://github.com/3niinfotech/3niinfotech_LeadManagement.git

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, Tailwind, Redux Toolkit, AG Grid, React Hook Form, Zod |
| Backend | Node.js, Express, Prisma, MySQL/MariaDB, JWT, Socket.io |
| Database | MySQL/MariaDB 8+ / MariaDB 10.4+ |

## Project structure

```
├── frontend/          # React SPA
├── backend/           # Express API + Prisma
├── database/          # Canonical DB docs + latest backup
│   ├── README.md
│   └── backups/
│       └── latest_database.sql
├── docs/              # Architecture notes
├── .env.example       # Environment variable reference
└── README.md
```

## Prerequisites

- Node.js 18+ (16+ minimum)
- MySQL/MariaDB (XAMPP, WAMP, or MySQL Server)
- Git

## Quick start

### 1. Database

**Option A — fresh setup**

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
```

**Option B — restore latest backup**

```bash
# Create database lead_management_crm, then:
mysql -u root -p lead_management_crm < database/backups/latest_database.sql

cd backend
cp .env.example .env
npm install
npx prisma generate
```

See [database/README.md](database/README.md) for export/restore details.

### 2. Backend

```bash
cd backend
npm run dev
```

API: `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000` (Vite may use 3001+ if busy)

### Default login

- Email: `admin@crm.com`
- Password: `Admin@123`

## Production build

```bash
cd frontend
npm run build

cd ../backend
npm start
```

## Environment

Copy `backend/.env.example` → `backend/.env`. See root [.env.example](.env.example) for variable list.

**Never commit `.env` files or secrets.**

## Architecture notes

### Backend layers

```
Route → Controller → Service → Repository → Database (Prisma)
```

### Multi-tenant isolation

- **Company** = tenant boundary
- All data scoped via `branchId → branch.companyId`
- Tenant users must have `companyId`

### Master Data (W1/W2)

One generic relational Master engine serves 20 entities (department, country, university, course, intake, etc.) via `/master/:slug`.

Company and Branch remain outside the W2 relational engine (Organization/W3 not started).

### Key modules

- Enquiry / Walk-in / Assignment
- Student lifecycle
- RBAC + permissions
- Feature toggles
- Audit logs + activity timeline

## Database commands

```bash
cd backend
npm run db:export          # Export to database/backups/latest_database.sql
npm run db:verify-backup   # Test restore into temp DB
npm run db:seed-relational-masters
npm run db:studio          # Prisma Studio
```

## Development

```bash
# Backend tests/scripts (examples)
node scripts/test-w1-masters.js
node scripts/verify-w0.js
```

## License

Proprietary — 3ni Infotech
