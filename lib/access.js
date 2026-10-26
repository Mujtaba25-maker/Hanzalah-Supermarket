// Explicit response allowlists keep financial fields out of cashier responses.
const pick = (row, keys) => Object.fromEntries(keys.filter(key => row[key] !== undefined).map(key => [key, row[key]]));
const productKeys = ['id', 'sku', 'barcode', 'name', 'category', 'stock', 'minStock', 'price'];
const saleKeys = ['id', 'productId', 'productName', 'customerId', 'customerName', 'quantity', 'unitPrice', 'total', 'paymentMethod', 'cashierId', 'cashierName', 'createdAt'];
const orderKeys = ['id', 'customer', 'status', 'total', 'date', 'items', 'createdAt', 'createdBy'];
const refundKeys = ['id', 'saleId', 'productId', 'productName', 'quantity', 'unitPrice', 'total', 'reason', 'userId', 'userName', 'createdAt'];
const isStaff = user => ['admin', 'manager', 'cashier'].includes(user?.role);
const isManagement = user => ['admin', 'manager'].includes(user?.role);
const productFor = (product, user) => isManagement(user) ? product : pick(product, productKeys);
const saleFor = (sale, user) => isManagement(user) ? sale : pick(sale, saleKeys);
function storeFor(store, user) {
  if (!isStaff(user)) throw new Error('Access denied.');
  if (isManagement(user)) return { ...store, users: user.role === 'admin' ? store.users : [], audits: user.role === 'admin' ? store.audits : [], currentUser: user };
  const sales = store.sales.filter(sale => sale.cashierId === user.id).map(sale => saleFor(sale, user));
  const saleIds = new Set(sales.map(sale => sale.id));
  const products = store.products.map(product => productFor(product, user));
  const orders = store.orders.filter(order => order.createdBy === user.id).map(order => pick(order, orderKeys));
  return {
    currentUser: user, products, customers: store.customers, sales, orders,
    refunds: store.refunds.filter(refund => saleIds.has(refund.saleId)).map(refund => pick(refund, refundKeys)),
    suppliers: [], purchases: [], users: [], audits: [],
    settings: pick(store.settings, ['storeName', 'currency', 'receiptFooter', 'demo']),
    summary: { lowStock: products.filter(p => p.stock <= p.minStock).length, lowStockItems: products.filter(p => p.stock <= p.minStock) },
    notifications: [{ id: 'scope', title: 'Your workspace', message: 'Sales, orders and receipts are limited to your account.' }]
  };
}
module.exports = { isStaff, isManagement, productFor, saleFor, storeFor };
