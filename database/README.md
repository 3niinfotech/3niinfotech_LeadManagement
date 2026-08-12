# Database — Lead Management CRM

## Engine

| Item | Value |
|------|--------|
| Engine | MySQL / MariaDB (tested with MariaDB 10.4 via XAMPP) |
| ORM | Prisma 5 |
| Default database name | `lead_management_crm` |
| Connection | `DATABASE_URL` in `backend/.env` |

## Canonical backup

```
database/backups/latest_database.sql
```

This file is the **latest verified export** of the current local database (`lead_management_crm`).

Last verified restore test: **67 tables** imported successfully into a temporary database.

## Export (real database)

From project root:

```bash
cd backend
npm run db:export
```

This runs `backend/scripts/export-database.js` and writes/overwrites:

`database/backups/latest_database.sql`

Requirements:
- MySQL/MariaDB running
- Valid `DATABASE_URL` in `backend/.env`
- `mysqldump` in PATH or XAMPP at `C:\xampp\mysql\bin\mysqldump.exe`

## Verify backup restore

```bash
cd backend
npm run db:verify-backup
```

Creates a temporary database, imports `latest_database.sql`, checks table/data counts, then drops the temp database.

## Fresh setup (empty machine)

```bash
cd backend
cp .env.example .env
# edit DATABASE_URL if needed

npm install
npm run db:setup
```

`db:setup` creates the database, applies Prisma schema (`db push`), and seeds default admin + RBAC.

## Restore from backup

**Warning:** Restoring overwrites data in the target database.

1. Create or select target database in MySQL
2. Import SQL:

```bash
# XAMPP example
"C:\xampp\mysql\bin\mysql.exe" -u root -p lead_management_crm < database/backups/latest_database.sql
```

Or use phpMyAdmin → Import → select `latest_database.sql`.

3. Ensure `backend/.env` `DATABASE_URL` points to that database
4. Regenerate Prisma client:

```bash
cd backend
npx prisma generate
```

## Migrations / schema

Schema source of truth: `backend/prisma/schema.prisma`

This project uses **Prisma db push** for schema sync in development:

```bash
cd backend
npx prisma db push
```

Relational master seed (W0):

```bash
npm run db:seed-relational-masters
```

Legacy MasterItem seed:

```bash
npm run db:seed-masters
```

## Default login (after seed)

- Email: `admin@crm.com`
- Password: `Admin@123`

## Security

- Never commit `backend/.env`
- Never put real passwords or JWT secrets in SQL backups (exports contain application data only)
- Rotate secrets before production deployment
