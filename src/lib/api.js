import { extraCustomers, orders } from "../data/mockData";

export async function loadDashboardData() {
  const response = await fetch("/api/store");
  const store = await response.json();

  if (!response.ok) {
    throw new Error(store.error || "Unable to load store data.");
  }

  return {
    ...store,
    analytics: buildAnalytics(store),
    orders: [...orders, ...(store.orders || [])],
    customersView: [
      ...store.customers.map(customer => ({
        ...customer,
        email: customer.email || "customer@example.com",
        orders: [...orders, ...(store.orders || [])].filter(order => order.customer === customer.name).length || 1
      })),
      ...extraCustomers
    ]
  };
}

export async function createOrder(order) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to create order.");
  return data;
}

export async function findProductByBarcode(barcode) {
  const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No product found for this barcode.");
  return data;
}

function buildAnalytics(store) {
  const productById = new Map(store.products.map(product => [product.id, product]));
  const salesByDate = new Map();
  const products = new Map();
  const categories = new Map();

  for (const sale of store.sales) {
    const saleDate = new Date(sale.createdAt);
    const dateKey = toDateKey(saleDate);
    const currentDate = salesByDate.get(dateKey) || {
      date: dateKey,
      label: formatTrendLabel(saleDate),
      sales: 0,
      profit: 0,
      orders: 0
    };
    currentDate.sales += sale.total;
    currentDate.profit += sale.profit;
    currentDate.orders += 1;
    salesByDate.set(dateKey, currentDate);

    const currentProduct = products.get(sale.productName) || { name: sale.productName, units: 0, sales: 0 };
    currentProduct.units += sale.quantity;
    currentProduct.sales += sale.total;
    products.set(sale.productName, currentProduct);

    const category = normalizeCategory(productById.get(sale.productId)?.category || "Uncategorized");
    categories.set(category, (categories.get(category) || 0) + sale.total);
  }

  const salesTrend = buildSalesTrend(Array.from(salesByDate.values()));

  return {
    salesTrend: salesTrend.map(row => ({
      ...row,
      sales: roundMoney(row.sales),
      profit: roundMoney(row.profit)
    })),
    topProducts: Array.from(products.values())
      .sort((a, b) => b.units - a.units)
      .map(row => ({ ...row, sales: roundMoney(row.sales) })),
    categorySales: Array.from(categories, ([name, value]) => ({ name, value: roundMoney(value) }))
      .sort((a, b) => b.value - a.value)
  };
}

function normalizeCategory(category) {
  return String(category)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) || "Uncategorized";
}

function buildSalesTrend(rows) {
  const today = stripTime(new Date());
  const earliestSale = rows.length
    ? rows.map(row => parseDateKey(row.date)).sort((a, b) => a - b)[0]
    : today;
  const defaultStart = addDays(today, -6);
  const start = earliestSale < defaultStart ? earliestSale : defaultStart;
  const byDate = new Map(rows.map(row => [row.date, row]));
  const trend = [];

  for (let day = start; day <= today; day = addDays(day, 1)) {
    const key = toDateKey(day);
    trend.push(byDate.get(key) || {
      date: key,
      label: formatTrendLabel(day),
      sales: 0,
      profit: 0,
      orders: 0
    });
  }

  return trend;
}

function toDateKey(date) {
  const localDate = stripTime(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
  return stripTime(new Date(`${key}T00:00:00`));
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatTrendLabel(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

export async function saveProduct(product) {
  const payload = { ...product };
  const id = payload.id;
  delete payload.id;

  const response = await fetch(id ? `/api/products/${id}` : "/api/products", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save product.");
  return data;
}

export async function recordSale(sale) {
  const response = await fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to record sale.");
  return data;
}
