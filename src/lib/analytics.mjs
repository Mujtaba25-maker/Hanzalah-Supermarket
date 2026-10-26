export const TIMEZONE = 'Asia/Kabul';
export const PERIODS = { today: 'Today', week: 'This week', month: 'This month', lastMonth: 'Last month', year: 'This year', all: 'All time' };
export function dateKey(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
const shift = (key, days) => new Date(Date.parse(`${key}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
export function periodBounds(period, now = new Date()) {
  const end = dateKey(now);
  const [y, m] = end.split('-').map(Number);
  const monthStart = `${end.slice(0, 7)}-01`;
  if (period === 'lastMonth') return { start: new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10), end: shift(monthStart, -1) };
  if (period === 'week') return { start: shift(end, -((new Date(`${end}T12:00:00Z`).getUTCDay() + 6) % 7)), end };
  return { start: period === 'today' ? end : period === 'month' ? monthStart : period === 'year' ? `${y}-01-01` : '', end };
}
export const inRange = (row, bounds) => {
  const key = dateKey(row.createdAt || row.date);
  return !!key && key >= bounds.start && key <= bounds.end;
};
export const displayName = value => String(value || '').replace(/\bjuse\b/gi, 'Juice');
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const rounded = value => Math.round(value * 100) / 100;
// Refunds reverse revenue and the original sale's cost, on the refund date.
export function financials(sales, refunds = [], allSales = sales) {
  const byId = new Map(allSales.map(sale => [sale.id, sale]));
  const returned = refunds.reduce((sum, row) => sum + number(row.total), 0);
  const unknownCost = sales.some(row => row.profit === undefined) || refunds.some(row => row.costReturned === undefined && byId.get(row.saleId)?.profit === undefined);
  const returnedCost = refunds.reduce((sum, row) => {
    const sale = byId.get(row.saleId);
    return sum + (row.costReturned !== undefined ? number(row.costReturned) : sale?.quantity ? number(row.quantity) * (number(sale.total) - number(sale.profit)) / sale.quantity : 0);
  }, 0);
  const revenue = rounded(sales.reduce((sum, row) => sum + number(row.total), 0) - returned);
  const cogs = unknownCost ? null : rounded(sales.reduce((sum, row) => sum + number(row.total) - number(row.profit), 0) - returnedCost);
  return { revenue, refunds: rounded(returned), cogs, grossProfit: cogs === null ? null : rounded(revenue - cogs) };
}
export function buildAnalytics(store, period = 'all', now = new Date(), customBounds) {
  const bounds = customBounds || periodBounds(period, now);
  const sales = store.sales.filter(row => inRange(row, bounds));
  const refunds = (store.refunds || []).filter(row => inRange(row, bounds));
  const totals = financials(sales, refunds, store.sales);
  const products = new Map(store.products.map(row => [row.id, row]));
  const byDay = new Map(), top = new Map(), categories = new Map();
  for (const row of [...sales, ...refunds]) {
    const key = dateKey(row.createdAt || row.date);
    if (!byDay.has(key)) byDay.set(key, { sales: [], refunds: [] });
    byDay.get(key)[row.saleId ? 'refunds' : 'sales'].push(row);
  }
  for (const sale of sales) {
    const name = displayName(sale.productName);
    const product = top.get(sale.productId) || { name, units: 0, sales: 0 };
    product.units += number(sale.quantity); product.sales += number(sale.total); top.set(sale.productId, product);
    const category = displayName(products.get(sale.productId)?.category || 'Uncategorized');
    categories.set(category, (categories.get(category) || 0) + number(sale.total));
  }
  const earliest = [...byDay.keys()].sort()[0] || bounds.end;
  const start = bounds.start || earliest;
  // Monthly buckets keep multi-year histories bounded and legible.
  const monthly = Date.parse(bounds.end) - Date.parse(start) > 100 * 86400000;
  const trend = new Map();
  for (let day = start; day <= bounds.end; day = shift(day, 1)) {
    const key = monthly ? day.slice(0, 7) : day;
    const row = trend.get(key) || { date: key, label: new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', ...(monthly ? { year: '2-digit' } : { day: 'numeric' }), timeZone: TIMEZONE }), sales: 0, ...(totals.grossProfit === null ? {} : { profit: 0 }) };
    const entries = byDay.get(day) || { sales: [], refunds: [] };
    const daily = financials(entries.sales, entries.refunds, store.sales);
    row.sales = rounded(row.sales + daily.revenue);
    if (totals.grossProfit !== null) row.profit = rounded(row.profit + daily.grossProfit);
    trend.set(key, row);
  }
  return { bounds, totals, sales, refunds, salesTrend: [...trend.values()], topProducts: [...top.values()].sort((a, b) => b.units - a.units).slice(0, 8), categorySales: [...categories].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) };
}
