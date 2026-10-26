const { MongoClient } = require("mongodb");
const crypto = require("crypto");
const { storeFor, productFor, saleFor, isStaff } = require("./access");
const { configuredBootstrapUsers } = require("./bootstrap");

let clientPromise;
let dbReadyPromise;

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
    db.collection("purchases").createIndex({ id: 1 }, { unique: true }),
    db.collection("refunds").createIndex({ id: 1 }, { unique: true }),
    db.collection("users").createIndex({ id: 1 }, { unique: true }),
    db.collection("users").createIndex({ username: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ token: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("audits").createIndex({ id: 1 }, { unique: true }),
    db.collection("settings").createIndex({ id: 1 }, { unique: true })
  ]);
}

// Initialize schema and explicitly configured accounts without importing local records.
async function seedDatabase() {
  const db = await getDb();
  await ensureIndexes(db);
  await ensureDefaultUsers(db);
  await ensureDefaultSettings(db);
  dbReadyPromise = Promise.resolve();
}

async function prepareDb() {
  const db = await getDb();
  if (!dbReadyPromise) {
    dbReadyPromise = initializeDb(db).catch(error => {
      dbReadyPromise = null;
      throw error;
    });
  }
  await dbReadyPromise;
  return db;
}

async function initializeDb(db) {
  await ensureIndexes(db);
  await ensureDefaultUsers(db);
  await ensureDefaultSettings(db);
}

async function listCollection(db, name) {
  return db.collection(name).find({}, { projection: { _id: 0 } }).toArray();
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    active: user.active !== false
  };
}

function defaultSettings() {
  return {
    id: "store",
    storeName: "Hanzala Supermarket",
    currency: "AFN",
    lowStockAlert: 10,
    receiptFooter: "Thank you for shopping with us.",
    showSalesTrend: true,
    enableLowStockWarnings: true,
    showNotificationBadge: true,
    updatedAt: new Date().toISOString()
  };
}

async function ensureDefaultUsers(db) {
  const count = await db.collection("users").countDocuments();
  if (count > 0) return;

  await db.collection("users").insertMany(configuredBootstrapUsers(process.env).map(user => ({
    id: createId("u"),
    name: user.name,
    username: user.username,
    role: user.role,
    active: true,
    passwordHash: hashPassword(user.password),
    createdAt: new Date().toISOString()
  })));
}

async function ensureDefaultSettings(db) {
  await db.collection("settings").updateOne(
    { id: "store" },
    { $setOnInsert: defaultSettings() },
    { upsert: true }
  );
  await db.collection("settings").updateOne(
    { id: "store", storeName: "Hanzalah Supermarket" },
    { $set: { storeName: "Hanzala Supermarket", currency: "AFN", updatedAt: new Date().toISOString() } }
  );
  await db.collection("settings").updateOne(
    { id: "store", currency: "USD" },
    { $set: { currency: "AFN", updatedAt: new Date().toISOString() } }
  );
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

async function audit(db, user, action, entity, detail) {
  const entry = {
    id: createId("audit"),
    action,
    entity,
    detail,
    userId: user?.id || "",
    userName: user?.name || "System",
    role: user?.role || "system",
    createdAt: new Date().toISOString()
  };
  await db.collection("audits").insertOne(entry);
  delete entry._id;
  return entry;
}

function summarize(store) {
  const inventoryValue = store.products.reduce((sum, product) => sum + product.stock * product.cost, 0);
  const lowStock = store.products.filter(product => product.stock <= product.minStock);
  const salesRevenue = store.sales.reduce((sum, sale) => sum + sale.total, 0);
  const refundsTotal = store.refunds.reduce((sum, refund) => sum + refund.total, 0);
  const purchaseSpend = store.purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const profit = store.sales.reduce((sum, sale) => sum + sale.profit, 0);
  const saleById = new Map(store.sales.map(sale => [sale.id, sale]));
  const returnedCost = store.refunds.reduce((sum, row) => {
    const sale = saleById.get(row.saleId);
    return sum + (row.costReturned ?? (sale?.quantity ? row.quantity * (sale.total - sale.profit) / sale.quantity : 0));
  }, 0);
  const totalExpense = store.sales.reduce((sum, sale) => sum + (sale.total - sale.profit), 0);
  const activeOrders = store.orders.filter(order => order.status !== "delivered").length;

  return {
    products: store.products.length,
    customers: store.customers.length,
    suppliers: store.suppliers.length,
    activeOrders,
    lowStock: lowStock.length,
    inventoryValue: roundMoney(inventoryValue),
    salesRevenue: roundMoney(salesRevenue - refundsTotal),
    refundsTotal: roundMoney(refundsTotal),
    purchaseSpend: roundMoney(purchaseSpend),
    profit: roundMoney(profit - refundsTotal + returnedCost),
    totalSales: roundMoney(salesRevenue - refundsTotal),
    costOfGoodsSold: roundMoney(totalExpense - returnedCost),
    totalExpense: roundMoney(totalExpense - returnedCost),
    totalProfit: roundMoney(profit - refundsTotal + returnedCost),
    recentSales: store.sales.slice(-6).reverse(),
    lowStockItems: lowStock.sort((a, b) => a.stock - b.stock)
  };
}

async function getStore(user) {
  if (!isStaff(user)) throw new Error("Access denied.");
  const db = await prepareDb();
  const [products, customers, suppliers, sales, orders, purchases, refunds, users, audits, settings] = await Promise.all([
    listCollection(db, "products"),
    listCollection(db, "customers"),
    user.role === "cashier" ? [] : listCollection(db, "suppliers"),
    db.collection("sales").find(user.role === "cashier" ? { cashierId: user.id } : {}, { projection: { _id: 0 } }).toArray(),
    db.collection("orders").find(user.role === "cashier" ? { createdBy: user.id } : {}, { projection: { _id: 0 } }).toArray(),
    user.role === "cashier" ? [] : listCollection(db, "purchases"),
    listCollection(db, "refunds"),
    user.role !== "admin" ? [] : db.collection("users").find({}, { projection: { _id: 0, passwordHash: 0 } }).toArray(),
    user.role !== "admin" ? [] : db.collection("audits").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(25).toArray(),
    db.collection("settings").findOne({ id: "store" }, { projection: { _id: 0 } })
  ]);
  const store = {
    products: products.map(normalizeProduct),
    customers,
    suppliers,
    sales,
    orders,
    purchases,
    refunds,
    users,
    audits,
    settings: settings || defaultSettings()
  };
  const summary = summarize(store);
  return storeFor({ ...store, summary, notifications: buildNotifications(store, summary) }, user);
}

function buildNotifications(store, summary) {
  const pendingOrders = store.orders.filter(order => order.status === "pending").length;
  const unpaidOrders = store.orders.filter(order => order.status !== "delivered").length;
  const notes = [];
  if (summary.lowStock) notes.push({ id: "low-stock", type: "warning", title: `${summary.lowStock} low stock item(s)`, message: "Review inventory and reorder products." });
  if (pendingOrders) notes.push({ id: "pending-orders", type: "info", title: `${pendingOrders} pending order(s)`, message: "Orders need status update or delivery." });
  if (unpaidOrders) notes.push({ id: "unpaid-orders", type: "money", title: `${unpaidOrders} active order(s)`, message: "Review orders awaiting delivery." });
  for (const audit of store.audits.slice(0, 3)) {
    notes.push({ id: audit.id, type: "activity", title: audit.action, message: `${audit.userName}: ${audit.detail}` });
  }
  return notes;
}

async function loginUser(payload) {
  const missing = validateRequired(payload, ["username", "password"]);
  if (missing) return { error: missing, status: 400 };

  const db = await prepareDb();
  const user = await db.collection("users").findOne({ username: String(payload.username).trim().toLowerCase() });
  if (!user || user.active === false || !verifyPassword(payload.password, user.passwordHash)) {
    return { error: "Invalid username or password.", status: 401 };
  }

  const token = crypto.randomBytes(32).toString("hex");
  await db.collection("sessions").insertOne({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12)
  });

  return {
    data: {
      user: publicUser(user),
      token
    },
    status: 200
  };
}

async function verifySession(token) {
  if (!token) return null;
  const db = await prepareDb();
  const session = await db.collection("sessions").findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await db.collection("users").findOne({ id: session.userId });
  return user && user.active !== false && isStaff(user) ? publicUser(user) : null;
}

async function findProductByBarcode(barcode, user) {
  const db = await prepareDb();
  const code = String(barcode || "").trim();
  const product = await db.collection("products").findOne({
    $or: [
      { barcode: { $regex: `^${escapeRegex(code)}$`, $options: "i" } },
      { sku: { $regex: `^${escapeRegex(code)}$`, $options: "i" } }
    ]
  }, { projection: { _id: 0 } });
  return product ? productFor(normalizeProduct(product), user) : null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createProduct(payload, user) {
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
  await audit(db, user, "Product created", "product", product.name);
  delete product._id;
  return { data: product, status: 201 };
}

async function updateProduct(id, payload, user) {
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
  await audit(db, user, "Product updated", "product", update.name);
  return { data: { ...existing, ...update, _id: undefined }, status: 200 };
}

async function deleteProduct(id, user) {
  const db = await prepareDb();
  const product = await db.collection("products").findOne({ id });
  const result = await db.collection("products").deleteOne({ id });
  if (!result.deletedCount) return { error: "Product not found.", status: 404 };
  await audit(db, user, "Product deleted", "product", product?.name || id);
  return { data: { ok: true }, status: 200 };
}

async function createContact(payload, user) {
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
  await audit(db, user, `${payload.type === "supplier" ? "Supplier" : "Customer"} created`, collection, contact.name);
  delete contact._id;
  return { data: contact, status: 201 };
}

async function updateContact(id, payload, user) {
  const collection = payload.type === "supplier" ? "suppliers" : "customers";
  const db = await prepareDb();
  const existing = await db.collection(collection).findOne({ id });
  if (!existing) return { error: "Contact not found.", status: 404 };

  const update = {
    name: String(payload.name || existing.name).trim(),
    phone: String(payload.phone || "").trim(),
    email: String(payload.email || "").trim(),
    address: String(payload.address || "").trim()
  };
  await db.collection(collection).updateOne({ id }, { $set: update });
  await audit(db, user, `${payload.type === "supplier" ? "Supplier" : "Customer"} updated`, collection, update.name);
  return { data: { ...existing, ...update, _id: undefined }, status: 200 };
}

async function createSale(payload, user) {
  const db = await prepareDb();
  const product = await db.collection("products").findOne({ id: payload.productId });
  if (!product) return { error: "Product not found.", status: 404 };

  const quantity = asNumber(payload.quantity);
  if (quantity <= 0) return { error: "Quantity must be greater than zero.", status: 400 };

  const unitPrice = user.role === "cashier" ? product.price : asNumber(payload.unitPrice, product.price);
  if (unitPrice < 0) return { error: "Price cannot be negative.", status: 400 };
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
    cashierId: user?.id || "",
    cashierName: user?.name || "",
    createdAt: new Date().toISOString()
  };
  await db.collection("sales").insertOne(sale);
  await audit(db, user, "Sale recorded", "sale", `${sale.productName} x ${quantity}`);
  delete sale._id;
  return { data: saleFor(sale, user), status: 201 };
}

async function createOrder(payload, user) {
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
    createdBy: user.id,
    customer: String(payload.customer).trim(),
    status,
    total: roundMoney(total),
    date: String(payload.date).trim(),
    items: Array.isArray(payload.items) ? payload.items : [],
    createdAt: new Date().toISOString()
  };
  await db.collection("orders").insertOne(order);
  await audit(db, user, "Order created", "order", `${order.id} for ${order.customer}`);
  delete order._id;
  return { data: order, status: 201 };
}

async function createPurchase(payload, user) {
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
  await audit(db, user, "Stock purchase recorded", "purchase", `${purchase.productName} x ${quantity}`);
  delete purchase._id;
  return { data: purchase, status: 201 };
}

async function createRefund(payload, user) {
  const db = await prepareDb();
  const sale = await db.collection("sales").findOne({ id: payload.saleId });
  if (!sale) return { error: "Sale not found.", status: 404 };

  if (user.role === "cashier" && sale.cashierId !== user.id) return { error: "You do not have permission for this sale.", status: 403 };
  const alreadyReturned = await db.collection("refunds").find({ saleId: sale.id }).toArray();
  const remaining = sale.quantity - alreadyReturned.reduce((sum, row) => sum + row.quantity, 0);
  const quantity = asNumber(payload.quantity, remaining);
  if (quantity > remaining) return { error: "Quantity exceeds the remaining refundable amount.", status: 400 };
  if (quantity <= 0) return { error: "Refund quantity must be greater than zero.", status: 400 };

  const total = roundMoney(quantity * sale.unitPrice);
  await db.collection("products").updateOne(
    { id: sale.productId },
    { $inc: { stock: quantity }, $set: { updatedAt: new Date().toISOString() } }
  );

  const refund = {
    id: createId("refund"),
    saleId: sale.id,
    productId: sale.productId,
    productName: sale.productName,
    quantity,
    unitPrice: sale.unitPrice,
    costReturned: roundMoney(quantity * (sale.unitPrice - sale.profit / sale.quantity)),
    total,
    reason: String(payload.reason || "Customer return").trim(),
    userId: user?.id || "",
    userName: user?.name || "",
    createdAt: new Date().toISOString()
  };
  await db.collection("refunds").insertOne(refund);
  await audit(db, user, "Refund recorded", "refund", `${refund.productName} ${roundMoney(total)}`);
  delete refund._id;
  return { data: user.role === "cashier" ? Object.fromEntries(Object.entries(refund).filter(([key]) => key !== "costReturned")) : refund, status: 201 };
}

async function updateSettings(payload, user) {
  const db = await prepareDb();
  const settings = {
    storeName: String(payload.storeName || "Hanzala Supermarket").trim(),
    currency: String(payload.currency || "AFN").trim(),
    lowStockAlert: asNumber(payload.lowStockAlert, 10),
    receiptFooter: String(payload.receiptFooter || "Thank you for shopping with us.").trim(),
    showSalesTrend: payload.showSalesTrend !== false,
    enableLowStockWarnings: payload.enableLowStockWarnings !== false,
    showNotificationBadge: payload.showNotificationBadge !== false,
    updatedAt: new Date().toISOString()
  };
  await db.collection("settings").updateOne({ id: "store" }, { $set: settings, $setOnInsert: { id: "store" } }, { upsert: true });
  await audit(db, user, "Settings updated", "settings", settings.storeName);
  return { data: { id: "store", ...settings }, status: 200 };
}

async function createUser(payload, user) {
  const missing = validateRequired(payload, ["name", "username", "role", "password"]);
  if (missing) return { error: missing, status: 400 };
  if (!["admin", "manager", "cashier"].includes(payload.role)) return { error: "Invalid role.", status: 400 };
  const db = await prepareDb();
  const nextUser = {
    id: createId("u"),
    name: String(payload.name).trim(),
    username: String(payload.username).trim().toLowerCase(),
    role: payload.role,
    active: payload.active !== false,
    passwordHash: hashPassword(payload.password),
    createdAt: new Date().toISOString()
  };
  await db.collection("users").insertOne(nextUser);
  await audit(db, user, "User created", "user", `${nextUser.name} (${nextUser.role})`);
  return { data: publicUser(nextUser), status: 201 };
}

async function updateUser(id, payload, user) {
  const db = await prepareDb();
  const existing = await db.collection("users").findOne({ id });
  if (!existing) return { error: "User not found.", status: 404 };
  const update = {
    name: String(payload.name || existing.name).trim(),
    role: ["admin", "manager", "cashier"].includes(payload.role) ? payload.role : existing.role,
    active: payload.active !== false,
    updatedAt: new Date().toISOString()
  };
  if (payload.password) update.passwordHash = hashPassword(payload.password);
  await db.collection("users").updateOne({ id }, { $set: update });
  await audit(db, user, "User updated", "user", update.name);
  return { data: publicUser({ ...existing, ...update }), status: 200 };
}

module.exports = {
  getStore,
  findProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  createContact,
  updateContact,
  createSale,
  createOrder,
  createPurchase,
  createRefund,
  updateSettings,
  createUser,
  updateUser,
  loginUser,
  verifySession,
  seedDatabase,
  logout: async token => { const db = await prepareDb(); await db.collection("sessions").deleteOne({ token }); return { data: { ok: true } }; }
};
