# Portfolio review

The React/Vite, Tailwind, MongoDB and Node HTTP architecture is preserved. No migration to a different server framework is required.

## Roles and data access

| Role | Access |
| --- | --- |
| admin (Owner / Admin) | Store financials, inventory, suppliers, purchases, reports, users, settings and audits. |
| manager | Store operations and reports; no user administration, settings changes, product deletion or audit history. |
| cashier | Checkout and customer lookup; only their own sales, orders, refunds and receipts. No cost, profit, purchasing, staff or management report data. |

The server session controls authorization in both API entry points. Cashier response allowlists also cover barcode and checkout responses. Unassigned legacy transactions remain management-only; ownership is never guessed.

## Reporting

Reporting uses Asia/Kabul. Weeks start Monday; last month means the previous calendar month. The shared dashboard selector updates financial totals, charts and recent transactions. Header figures always show today, and stock/order queues show the current state.

Net sales subtract refunds. Cost of goods sold reverses original cost for returns. Gross profit equals net sales minus cost of goods sold. Operating expenses and taxes are not tracked, so gross profit is never described as net profit. Category/product charts explicitly show sales before returns. Missing historical cost data is shown as unavailable.

Mock records and invented customer counts are excluded from live results. Display spelling corrections do not migrate existing database records. Loading failures are distinct from empty reporting periods, and refresh failures identify retained results as the last successful load.

## Isolated screenshot environment

Follow README.md to generate fictional demo data in a separate empty database ending in _demo. Passwords must be provided through environment variables; no demo password is stored in source or documentation. Use the built frontend and API together on port 3002 so a development proxy cannot accidentally point at the business API.

The seed creates six fictional products, three fictional customers, three orders, two cashiers, a manager, an owner, and 300 sales across 60 recent dates. Records and receipt settings are labeled as demo data. Existing records are never reset or mixed with this dataset.

Local screenshots, business fingerprints and verification JSON files stay in the ignored review-previews directory. Do not upload those files without checking that they show only fictional data.

## Verification

Run npm run check, npm test and npm run check:secrets. The tests cover authorization on both API entry points, cashier ownership, redaction, Kabul date boundaries, refund accounting, barcode/SKU lookup, checkout, stock changes, receipt inputs, session revocation and configurable initial accounts.

Browser review covered role-specific populated dashboards, period selection, mobile drawer keyboard handling, sidebar collapse, barcode input and receipt rendering. Physical scanner, camera and printer hardware require local verification. There is no configured lint tool.

## Publication boundary

The repository has a Vercel configuration and an existing GitHub production deployment/check. A normal push to the connected main branch may deploy automatically. Verify or disable the integration before publishing if deployment is not intended. This document does not authorize deployment.
