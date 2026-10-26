# Hanzala Supermarket

A role-based supermarket application built with React, JavaScript, Tailwind CSS, Recharts, MongoDB and a Node HTTP API. It supports inventory, barcode checkout, customers, suppliers, orders, receipts and reporting. Both local and serverless API entry points enforce role permissions.

## Local setup

Use Node.js 24 and a MongoDB connection that you control. Install dependencies and create your private configuration:

```powershell
npm ci
Copy-Item .env.example .env
```

Edit `.env` locally. Replace the connection-string placeholders, choose `MONGODB_DB`, and supply a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 12 characters for an empty database. Optional manager/cashier bootstrap passwords create those initial accounts only when explicitly configured. Existing accounts are never reset by these variables. Never commit `.env` or a working connection string.

```powershell
npm run dev
```

The development frontend is at `http://127.0.0.1:5173` and proxies `/api` to port 3000. For a production build served locally by the same API process:

```powershell
npm run build
npm start
```

Open `http://127.0.0.1:3000`. `npm run db:seed` initializes indexes, settings and explicitly configured initial accounts; it does not import business records or reset a database.

## Isolated fictional demo

The optional demo seed uses the configured MongoDB server but requires a separate, empty database name ending in `_demo`. It refuses the configured business database and any database that already contains records. There is no destructive reset command.

In a separate PowerShell session, while `MONGODB_DB` still names your business database:

```powershell
$env:MONGODB_DEMO_DB = 'hanzala_portfolio_demo'
$env:DEMO_PASSWORD = Read-Host 'Choose a demo-only password of at least 12 characters' -MaskInput
npm run db:seed:demo
```

The seed generates fictional products, customers, orders and 60 days of sales owned by two demo cashiers. All records are marked as demo data. Passwords are hashed using a random salt; no login password is embedded in the seed.

After a successful seed, explicitly start a separate local process against that database:

```powershell
npm run build
$env:MONGODB_DB = $env:MONGODB_DEMO_DB
$env:PORT = '3002'
npm start
```

Open **`http://127.0.0.1:3002/dashboard`**. The built frontend and updated API share the same port and database. Avoid using the default development frontend for this setup because its proxy targets port 3000.

| Demo role | Username | Password |
| --- | --- | --- |
| Owner / Admin | `admin` | Value supplied through `DEMO_PASSWORD` when seeded |
| Manager | `manager` | Same configured demo password |
| Cashier | `cashier` | Same configured demo password |
| Second cashier | `cashier2` | Same configured demo password |

The app displays a demo banner and a sample-data receipt footer. To restart an existing demo, set `MONGODB_DB` to that demo database and `PORT` to 3002, then run `npm start`; do not rerun the seed. Environment changes in these examples are process/session-local and do not rewrite `.env` or alter the business database.

## Permissions and reporting

- Admins manage the store, staff, settings and reports.
- Managers handle operations and store reports without user/settings administration or product deletion.
- Cashiers see their own transactions, orders, refunds and receipts. Costs, profit, purchases and management records are removed from API responses.
- Dates use `Asia/Kabul`. Gross profit is net sales minus cost of goods sold; overhead expenses and taxes are not tracked. Stock purchases are separate from cost of goods sold.

See [PORTFOLIO-REVIEW.md](PORTFOLIO-REVIEW.md) for reporting definitions and review scope.

## Checks

```powershell
npm run check
npm test
npm run check:secrets
# After staging, inspect the exact prospective commit:
node scripts/check-secrets.cjs --staged
git diff --cached --check
```

Tests use isolated in-memory fixtures or a temporary local HTTP server. They do not connect to either configured database. No lint configuration exists. Physical scanning/camera/printer hardware needs local testing. The secret checker is a focused safeguard and does not replace a broader security audit.

## GitHub and deployment

Keep environment files, credentials, local data, database exports, backups, logs, dependencies, generated builds and review screenshots out of Git. Only `.env.example` is tracked, with placeholders and empty password fields. Older local seed/contact fixtures and the legacy documentation generator are intentionally untracked and ignored.

`vercel.json` supports the existing hosting setup. The remote has a Vercel production deployment associated with `main`; pushing to that branch may trigger deployment. Confirm deployment settings before pushing. Local builds, tests and commits do not deploy the application. Removing files from the current tree does not remove them from earlier Git history; do not rewrite shared history or force-push as part of routine cleanup.
