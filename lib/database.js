const { MongoClient } = require("mongodb");
const seedData = require("../data/store.json");

const COLLECTIONS = ["products", "customers", "suppliers", "sales", "orders", "purchases"];
let clientPromise;

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Add your MongoDB Atlas connection string to .env locally and to Vercel environment variables.");
  }
  return uri;
}

async function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(getMongoUri());
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || "hanzalah_supermarket");
}

function normalizeProduct(product) {
  return {
    ...product,
    barcode: product.barcode || product.sku
  };
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection("products").createIndex({ id: 1 }, { unique: true }),
    db.collection("products").createIndex({ sku: 1 }, { unique: true }),
    db.collection("products").createIndex({ barcode: 1 }),
    db.collection("customers").createIndex({ id: 1 }, { unique: true }),
    db.collection("suppliers").createIndex({ id: 1 }, { unique: true }),
    db.collection("sales").createIndex({ id: 1 }, { unique: true }),
    db.collection("orders").createIndex({ id: 1 }, { unique: true }),
    db.collection("purchases").createIndex({ id: 1 }, { unique: true })
  ]);
}

async function seedIfEmpty(db) {
  const count = await db.collection("products").countDocuments();
  if (count > 0) return;

  const seed = {
    ...seedData,
    products: seedData.products.map(normalizeProduct),
    orders: seedData.orders || [],
    purchases: seedData.purchases || []
  };

  for (const collection of COLLECTIONS) {
    if (seed[collection]?.length) {
      await db.collection(collection).insertMany(seed[collection]);
    }
  }
}

async function seedDatabase({ force = false } = {}) {
  const db = await getDb();
  await ensureIndexes(db);

  if (force) {
    await Promise.all(COLLECTIONS.map(collection => db.collection(collection).deleteMany({})));
  }

  await seedIfEmpty(db);
}

async function prepareDb() {
  const db = await getDb();
  await ensureIndexes(db);
  await seedIfEmpty(db);
  return db;
}

async function listCollection(db, name) {
  return db.collection(name).find({}, { projection: { _id: 0 } }).toArray();
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function validateRequired(payload, fields) {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === "") {
      return `${field} is required.`;
    }
  }
  return "";
}

function summarize(store) {
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
    inventoryValue: roundMoney(inventoryValue),
    salesRevenue: roundMoney(salesRevenue),
    purchaseSpend: roundMoney(purchaseSpend),
    profit: roundMoney(profit),
    totalSales: roundMoney(salesRevenue),
    totalExpense: roundMoney(totalExpense),
    totalProfit: roundMoney(profit),
    recentSales: store.sales.slice(-6).reverse(),
    lowStockItems: lowStock.sort((a, b) => a.stock - b.stock)
  };
}

async function getStore() {
  const db = await prepareDb();
  const [products, customers, suppliers, sales, orders, purchases] = await Promise.all(
    COLLECTIONS.map(collection => listCollection(db, collection))
  );
  const store = {
    products: products.map(normalizeProduct),
    customers,
    suppliers,
    sales,
    orders,
    purchases
  };
  return { ...store, summary: summarize(store) };
}

async function findProductByBarcode(barcode) {
  const db = await prepareDb();
  const code = String(barcode || "").trim();
  const product = await db.collection("products").findOne({
    $or: [
      { barcode: { $regex: `^${escapeRegex(code)}$`, $options: "i" } },
      { sku: { $regex: `^${escapeRegex(code)}$`, $options: "i" } }
    ]
  }, { projection: { _id: 0 } });
  return product ? normalizeProduct(product) : null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createProduct(payload) {
  const missing = validateRequired(payload, ["sku", "name", "category"]);
  if (missing) return { error: missing, status: 400 };

  const db = await prepareDb();
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
  await db.collection("products").insertOne(product);
  delete product._id;
  return { data: product, status: 201 };
}

async function updateProduct(id, payload) {
  const db = await prepareDb();
  const existing = await db.collection("products").findOne({ id });
  if (!existing) return { error: "Product not found.", status: 404 };

  const update = {
    sku: String(payload.sku || existing.sku).trim(),
    barcode: String(payload.barcode || payload.sku || existing.barcode || existing.sku).trim(),
    name: String(payload.name || existing.name).trim(),
    category: String(payload.category || existing.category).trim(),
    stock: asNumber(payload.stock, existing.stock),
    minStock: asNumber(payload.minStock, existing.minStock),
    cost: asNumber(payload.cost, existing.cost),
    price: asNumber(payload.price, existing.price),
    supplierId: payload.supplierId || "",
    updatedAt: new Date().toISOString()
  };
  await db.collection("products").updateOne({ id }, { $set: update });
  return { data: { ...existing, ...update, _id: undefined }, status: 200 };
}

async function deleteProduct(id) {
  const db = await prepareDb();
  const result = await db.collection("products").deleteOne({ id });
  if (!result.deletedCount) return { error: "Product not found.", status: 404 };
  return { data: { ok: true }, status: 200 };
}

async function createContact(payload) {
  const collection = payload.type === "supplier" ? "suppliers" : "customers";
  const prefix = payload.type === "supplier" ? "s" : "c";
  const missing = validateRequired(payload, ["name"]);
  if (missing) return { error: missing, status: 400 };

  const db = await prepareDb();
  const contact = {
    id: createId(prefix),
    name: String(payload.name).trim(),
    phone: String(payload.phone || "").trim(),
    email: String(payload.email || "").trim(),
    address: String(payload.address || "").trim()
  };
  await db.collection(collection).insertOne(contact);
  delete contact._id;
  return { data: contact, status: 201 };
}

async function createSale(payload) {
  const db = await prepareDb();
  const product = await db.collection("products").findOne({ id: payload.productId });
  if (!product) return { error: "Product not found.", status: 404 };

  const quantity = asNumber(payload.quantity);
  if (quantity <= 0) return { error: "Quantity must be greater than zero.", status: 400 };

  const unitPrice = asNumber(payload.unitPrice, product.price);
  const total = roundMoney(quantity * unitPrice);
  const profit = roundMoney(quantity * (unitPrice - product.cost));

  const stockUpdate = await db.collection("products").updateOne(
    { id: product.id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity }, $set: { updatedAt: new Date().toISOString() } }
  );
  if (!stockUpdate.modifiedCount) return { error: "Not enough stock for this sale.", status: 400 };

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
  await db.collection("sales").insertOne(sale);
  delete sale._id;
  return { data: sale, status: 201 };
}

async function createOrder(payload) {
  const missing = validateRequired(payload, ["customer", "status", "total", "date"]);
  if (missing) return { error: missing, status: 400 };

  const status = String(payload.status).trim().toLowerCase();
  if (!["pending", "shipped", "delivered"].includes(status)) {
    return { error: "Order status must be pending, shipped, or delivered.", status: 400 };
  }

  const total = asNumber(payload.total);
  if (total < 0) return { error: "Order total cannot be negative.", status: 400 };

  const db = await prepareDb();
  const order = {
    id: payload.id || `ORD-${String(Date.now()).slice(-6)}`,
    customer: String(payload.customer).trim(),
    status,
    total: roundMoney(total),
    date: String(payload.date).trim(),
    items: Array.isArray(payload.items) ? payload.items : [],
    createdAt: new Date().toISOString()
  };
  await db.collection("orders").insertOne(order);
  delete order._id;
  return { data: order, status: 201 };
}

async function createPurchase(payload) {
  const db = await prepareDb();
  const product = await db.collection("products").findOne({ id: payload.productId });
  if (!product) return { error: "Product not found.", status: 404 };

  const quantity = asNumber(payload.quantity);
  if (quantity <= 0) return { error: "Quantity must be greater than zero.", status: 400 };

  const unitCost = asNumber(payload.unitCost, product.cost);
  await db.collection("products").updateOne(
    { id: product.id },
    { $inc: { stock: quantity }, $set: { cost: unitCost, updatedAt: new Date().toISOString() } }
  );

  const purchase = {
    id: createId("purchase"),
    productId: product.id,
    productName: product.name,
    supplierId: payload.supplierId || product.supplierId || "",
    quantity,
    unitCost,
    total: roundMoney(quantity * unitCost),
    createdAt: new Date().toISOString()
  };
  await db.collection("purchases").insertOne(purchase);
  delete purchase._id;
  return { data: purchase, status: 201 };
}

module.exports = {
  getStore,
  findProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  createContact,
  createSale,
  createOrder,
  createPurchase,
  seedDatabase
};
