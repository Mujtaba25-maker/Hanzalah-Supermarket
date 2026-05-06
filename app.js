const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, "dist");
const PUBLIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8"
};

const starterData = {
  products: [
    {
      id: "p_1001",
      sku: "MILK-1L",
      name: "Fresh Milk 1L",
      category: "Groceries",
      stock: 42,
      minStock: 12,
      cost: 0.85,
      price: 1.25,
      supplierId: "s_1001",
      updatedAt: new Date().toISOString()
    },
    {
      id: "p_1002",
      sku: "RICE-5KG",
      name: "Basmati Rice 5kg",
      category: "Groceries",
      stock: 18,
      minStock: 8,
      cost: 7.4,
      price: 10.5,
      supplierId: "s_1002",
      updatedAt: new Date().toISOString()
    },
    {
      id: "p_1003",
      sku: "SOAP-125",
      name: "Hand Soap 125g",
      category: "Household",
      stock: 9,
      minStock: 15,
      cost: 0.42,
      price: 0.75,
      supplierId: "s_1001",
      updatedAt: new Date().toISOString()
    }
  ],
  customers: [
    { id: "c_1001", name: "Walk-in Customer", phone: "", email: "", address: "" },
    { id: "c_1002", name: "Ahmad Shah", phone: "0700000000", email: "", address: "Kabul" }
  ],
  suppliers: [
    { id: "s_1001", name: "City Wholesale", phone: "0790000000", email: "sales@city.example", address: "Main market" },
    { id: "s_1002", name: "Golden Grain Co.", phone: "0780000000", email: "orders@golden.example", address: "Warehouse district" }
  ],
  sales: [],
  orders: [],
  purchases: []
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(starterData, null, 2));
  }
}

function readStore() {
  ensureDataFile();
  const store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  store.orders = store.orders || [];
  store.products = store.products.map(product => ({
    ...product,
    barcode: product.barcode || product.sku
  }));
  return store;
}

function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
  });
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function summarize(store) {
  const inventoryValue = store.products.reduce((sum, product) => sum + product.stock * product.cost, 0);
  const lowStock = store.products.filter(product => product.stock <= product.minStock);
  const salesRevenue = store.sales.reduce((sum, sale) => sum + sale.total, 0);
  const purchaseSpend = store.purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const profit = store.sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalExpense = store.sales.reduce((sum, sale) => sum + (sale.total - sale.profit), 0);
  const activeOrders = (store.orders || []).filter(order => order.status !== "delivered").length;

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

function validateRequired(payload, fields) {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === "") {
      return `${field} is required.`;
    }
  }
  return "";
}

async function handleApi(req, res, pathname) {
  const store = readStore();

  if (req.method === "GET" && pathname === "/api/store") {
    store.orders = store.orders || [];
    sendJson(res, 200, { ...store, summary: summarize(store) });
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/products/barcode/")) {
    const barcode = decodeURIComponent(pathname.split("/").pop()).trim().toLowerCase();
    const product = store.products.find(item =>
      String(item.barcode || "").trim().toLowerCase() === barcode ||
      String(item.sku || "").trim().toLowerCase() === barcode
    );
    if (!product) return sendError(res, 404, "No product found for this barcode.");
    sendJson(res, 200, product);
    return;
  }

  if (req.method === "POST" && pathname === "/api/products") {
    const payload = await readBody(req);
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
    writeStore(store);
    sendJson(res, 201, product);
    return;
  }

  if (req.method === "PUT" && pathname.startsWith("/api/products/")) {
    const id = pathname.split("/").pop();
    const payload = await readBody(req);
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
    writeStore(store);
    sendJson(res, 200, product);
    return;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/products/")) {
    const id = pathname.split("/").pop();
    const before = store.products.length;
    store.products = store.products.filter(item => item.id !== id);
    if (store.products.length === before) return sendError(res, 404, "Product not found.");
    writeStore(store);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathname === "/api/contacts") {
    const payload = await readBody(req);
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
    writeStore(store);
    sendJson(res, 201, contact);
    return;
  }

  if (req.method === "POST" && pathname === "/api/sales") {
    const payload = await readBody(req);
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
    writeStore(store);
    sendJson(res, 201, sale);
    return;
  }

  if (req.method === "POST" && pathname === "/api/orders") {
    const payload = await readBody(req);
    const missing = validateRequired(payload, ["customer", "status", "total", "date"]);
    if (missing) return sendError(res, 400, missing);

    store.orders = store.orders || [];
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
    writeStore(store);
    sendJson(res, 201, order);
    return;
  }

  if (req.method === "POST" && pathname === "/api/purchases") {
    const payload = await readBody(req);
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
    writeStore(store);
    sendJson(res, 201, purchase);
    return;
  }

  sendError(res, 404, "API route not found.");
}

function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendError(res, 403, "Forbidden.");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      const isAppRoute = !path.extname(filePath);
      const indexPath = path.join(PUBLIC_DIR, "index.html");
      if (isAppRoute && fs.existsSync(indexPath)) {
        fs.readFile(indexPath, (indexError, indexContent) => {
          if (indexError) {
            sendError(res, 404, "File not found.");
            return;
          }
          res.writeHead(200, { "Content-Type": contentTypes[".html"] });
          res.end(indexContent);
        });
        return;
      }
      sendError(res, 404, "File not found.");
      return;
    }
    const type = contentTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (error) {
    sendError(res, 500, error.message || "Server error.");
  }
});

ensureDataFile();
server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Close the other server or start this app with another port, for example: $env:PORT=3001; npm start`);
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`Store management system running at http://localhost:${PORT}`);
});
