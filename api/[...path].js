const seedData = require("../data/store.json");

let store = JSON.parse(JSON.stringify(seedData));
store.orders = store.orders || [];
store.products = store.products.map(product => ({
  ...product,
  barcode: product.barcode || product.sku
}));

function sendJson(res, status, body) {
  res.status(status).json(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bodyOf(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function validateRequired(payload, fields) {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === "") {
      return `${field} is required.`;
    }
  }
  return "";
}

function summarize() {
  const inventoryValue = store.products.reduce((sum, product) => sum + product.stock * product.cost, 0);
  const lowStock = store.products.filter(product => product.stock <= product.minStock);
  const salesRevenue = store.sales.reduce((sum, sale) => sum + sale.total, 0);
  const purchaseSpend = store.purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const profit = store.sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalExpense = store.sales.reduce((sum, sale) => sum + (sale.total - sale.profit), 0);
  const activeOrders = store.orders.filter(order => order.status !== "delivered").length;

  return {
    products: store.products.length,
    customers: store.customers.length,
    suppliers: store.suppliers.length,
    activeOrders,
    lowStock: lowStock.length,
    inventoryValue,
    salesRevenue,
    purchaseSpend,
    profit,
    totalSales: salesRevenue,
    totalExpense,
    totalProfit: profit,
    recentSales: store.sales.slice(-6).reverse(),
    lowStockItems: lowStock.sort((a, b) => a.stock - b.stock)
  };
}

module.exports = function handler(req, res) {
  const parts = Array.isArray(req.query.path) ? req.query.path : [];
  const [resource, id, extra] = parts;

  if (req.method === "GET" && resource === "store") {
    return sendJson(res, 200, { ...store, summary: summarize() });
  }

  if (req.method === "GET" && resource === "products" && id === "barcode" && extra) {
    const barcode = decodeURIComponent(extra).trim().toLowerCase();
    const product = store.products.find(item =>
      String(item.barcode || "").trim().toLowerCase() === barcode ||
      String(item.sku || "").trim().toLowerCase() === barcode
    );
    if (!product) return sendError(res, 404, "No product found for this barcode.");
    return sendJson(res, 200, product);
  }

  if (req.method === "POST" && resource === "products" && !id) {
    const payload = bodyOf(req);
    const missing = validateRequired(payload, ["sku", "name", "category"]);
    if (missing) return sendError(res, 400, missing);

    const product = {
      id: createId("p"),
      sku: String(payload.sku).trim(),
      barcode: String(payload.barcode || payload.sku).trim(),
      name: String(payload.name).trim(),
      category: String(payload.category).trim(),
      stock: asNumber(payload.stock),
      minStock: asNumber(payload.minStock),
      cost: asNumber(payload.cost),
      price: asNumber(payload.price),
      supplierId: payload.supplierId || "",
      updatedAt: new Date().toISOString()
    };
    store.products.push(product);
    return sendJson(res, 201, product);
  }

  if (req.method === "PUT" && resource === "products" && id) {
    const payload = bodyOf(req);
    const product = store.products.find(item => item.id === id);
    if (!product) return sendError(res, 404, "Product not found.");

    Object.assign(product, {
      sku: String(payload.sku || product.sku).trim(),
      barcode: String(payload.barcode || payload.sku || product.barcode || product.sku).trim(),
      name: String(payload.name || product.name).trim(),
      category: String(payload.category || product.category).trim(),
      stock: asNumber(payload.stock, product.stock),
      minStock: asNumber(payload.minStock, product.minStock),
      cost: asNumber(payload.cost, product.cost),
      price: asNumber(payload.price, product.price),
      supplierId: payload.supplierId || "",
      updatedAt: new Date().toISOString()
    });
    return sendJson(res, 200, product);
  }

  if (req.method === "DELETE" && resource === "products" && id) {
    const before = store.products.length;
    store.products = store.products.filter(item => item.id !== id);
    if (store.products.length === before) return sendError(res, 404, "Product not found.");
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && resource === "contacts") {
    const payload = bodyOf(req);
    const collection = payload.type === "supplier" ? "suppliers" : "customers";
    const prefix = payload.type === "supplier" ? "s" : "c";
    const missing = validateRequired(payload, ["name"]);
    if (missing) return sendError(res, 400, missing);

    const contact = {
      id: createId(prefix),
      name: String(payload.name).trim(),
      phone: String(payload.phone || "").trim(),
      email: String(payload.email || "").trim(),
      address: String(payload.address || "").trim()
    };
    store[collection].push(contact);
    return sendJson(res, 201, contact);
  }

  if (req.method === "POST" && resource === "sales") {
    const payload = bodyOf(req);
    const product = store.products.find(item => item.id === payload.productId);
    if (!product) return sendError(res, 404, "Product not found.");

    const quantity = asNumber(payload.quantity);
    if (quantity <= 0) return sendError(res, 400, "Quantity must be greater than zero.");
    if (product.stock < quantity) return sendError(res, 400, "Not enough stock for this sale.");

    const unitPrice = asNumber(payload.unitPrice, product.price);
    const total = quantity * unitPrice;
    const profit = quantity * (unitPrice - product.cost);
    product.stock -= quantity;
    product.updatedAt = new Date().toISOString();

    const sale = {
      id: createId("sale"),
      productId: product.id,
      productName: product.name,
      customerId: payload.customerId || "",
      quantity,
      unitPrice,
      total,
      profit,
      paymentMethod: payload.paymentMethod || "Cash",
      createdAt: new Date().toISOString()
    };
    store.sales.push(sale);
    return sendJson(res, 201, sale);
  }

  if (req.method === "POST" && resource === "orders") {
    const payload = bodyOf(req);
    const missing = validateRequired(payload, ["customer", "status", "total", "date"]);
    if (missing) return sendError(res, 400, missing);

    const status = String(payload.status).trim().toLowerCase();
    if (!["pending", "shipped", "delivered"].includes(status)) {
      return sendError(res, 400, "Order status must be pending, shipped, or delivered.");
    }

    const total = asNumber(payload.total);
    if (total < 0) return sendError(res, 400, "Order total cannot be negative.");

    const order = {
      id: payload.id || `ORD-${String(Date.now()).slice(-6)}`,
      customer: String(payload.customer).trim(),
      status,
      total,
      date: String(payload.date).trim(),
      items: Array.isArray(payload.items) ? payload.items : []
    };
    store.orders.push(order);
    return sendJson(res, 201, order);
  }

  if (req.method === "POST" && resource === "purchases") {
    const payload = bodyOf(req);
    const product = store.products.find(item => item.id === payload.productId);
    if (!product) return sendError(res, 404, "Product not found.");

    const quantity = asNumber(payload.quantity);
    if (quantity <= 0) return sendError(res, 400, "Quantity must be greater than zero.");

    const unitCost = asNumber(payload.unitCost, product.cost);
    product.stock += quantity;
    product.cost = unitCost;
    product.updatedAt = new Date().toISOString();

    const purchase = {
      id: createId("purchase"),
      productId: product.id,
      productName: product.name,
      supplierId: payload.supplierId || product.supplierId || "",
      quantity,
      unitCost,
      total: quantity * unitCost,
      createdAt: new Date().toISOString()
    };
    store.purchases.push(purchase);
    return sendJson(res, 201, purchase);
  }

  return sendError(res, 404, "API route not found.");
};
