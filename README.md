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
- MongoDB Atlas-backed API for real persistent storage
- Vercel-ready serverless API routes

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router
- React Icons
- Recharts
- Node.js API
- MongoDB Atlas

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```bash
cp .env.example .env
```

Add your MongoDB Atlas connection string:

```text
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=hanzalah_supermarket
```

Seed the database if it is empty:

```bash
npm run db:seed
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

Seed MongoDB Atlas:

```bash
npm run db:seed
```

Reset and reseed MongoDB Atlas:

```bash
npm run db:seed:force
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

Add these Vercel environment variables:

```text
MONGODB_URI
MONGODB_DB
```

## Data Persistence

The app now uses MongoDB Atlas for persistent products, sales, orders, customers, suppliers, and purchases. The local `data/store.json` file is only seed data for initializing MongoDB.

## Project Structure

```text
api/                 Vercel serverless API
data/                Seed JSON data
lib/                 MongoDB database service
scripts/             Database seed scripts
src/components/      Reusable UI components
src/pages/           Dashboard pages
src/lib/             API and analytics helpers
app.js               Local Node server
vercel.json          Vercel routing/build config
```
