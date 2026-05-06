# Hanzalah Supermarket

Modern store management dashboard for inventory, sales, orders, customers, analytics, and barcode-assisted workflows.

## Features

- Dashboard summary cards for sales, expenses, profit, active orders, customers, and low stock
- Sales analytics with line, bar, and pie charts
- Product sales form with barcode scanner input
- Inventory table with add/edit product modal and barcode fields
- Order management with filters, search, pagination, and barcode-based order items
- Customer management table with search and sorting
- Responsive React + Tailwind CSS admin layout
- Local JSON-backed API for development
- Vercel-ready serverless API routes for demo deployment

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router
- React Icons
- Recharts
- Node.js API

## Getting Started

Install dependencies:

```bash
npm install
```

Run the production-style local server:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

For frontend development with Vite:

```bash
npm run dev
```

## Useful Commands

Build the React app:

```bash
npm run build
```

Check backend/API syntax and build frontend:

```bash
npm run check
```

## Barcode Workflow

Most USB barcode scanners work like a keyboard: focus the barcode input, scan the barcode, and the scanner types the code then presses Enter.

Existing products use their SKU as the default barcode. You can edit or add a product barcode from the Inventory page.

## Vercel Deployment

This repo includes:

- `vercel.json`
- `api/[...path].js`

Deploy from GitHub using Vercel defaults:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Data Persistence Note

Local development uses `data/store.json` for storage.

On Vercel, serverless functions do not permanently write to local JSON files. The deployed version works as a demo, but changes may reset. For production use, connect a database such as MongoDB, Supabase, Neon, or Vercel Postgres.

## Project Structure

```text
api/                 Vercel serverless API
data/                Local JSON data
src/components/      Reusable UI components
src/pages/           Dashboard pages
src/lib/             API and analytics helpers
app.js               Local Node server
vercel.json          Vercel routing/build config
```
