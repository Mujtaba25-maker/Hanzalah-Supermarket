import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalytics, dateKey, periodBounds, financials } from '../src/lib/analytics.mjs';
test('Kabul midnight differs from UTC and date-only values stay calendar dates', () => {
  assert.equal(dateKey('2026-10-25T20:00:00Z'), '2026-10-26');
  assert.equal(dateKey('2026-10-25'), '2026-10-25');
  assert.equal(dateKey('invalid'), '');
});
test('last month uses the previous calendar month including leap years', () => {
  assert.deepEqual(periodBounds('lastMonth', '2026-10-26T09:00:00Z'), {start:'2026-09-01',end:'2026-09-30'});
  assert.deepEqual(periodBounds('lastMonth', '2024-03-15T09:00:00Z'), {start:'2024-02-01',end:'2024-02-29'});
  assert.deepEqual(periodBounds('lastMonth', '2026-01-15T09:00:00Z'), {start:'2025-12-01',end:'2025-12-31'});
});
test('week begins Monday in Kabul', () => {
  assert.deepEqual(periodBounds('week','2026-10-25T20:00:00Z'), {start:'2026-10-26',end:'2026-10-26'});
});
const sale = {id:'s', productId:'p', productName:'Juse',quantity:2,total:100,profit:40,createdAt:'2026-09-30T19:29:59Z'};
const store = {products:[{id:'p',category:'Juse'}], sales:[sale,{...sale,id:'outside',createdAt:'2026-09-30T19:30:00Z'}], refunds:[]};
test('one range controls totals, chart, categories, products and table at midnight boundaries', () => {
  const result=buildAnalytics(store,'lastMonth','2026-10-26T09:00:00Z');
  assert.equal(result.sales.length,1); assert.equal(result.totals.revenue,100);
  assert.equal(result.salesTrend.length,30);
  assert.equal(result.salesTrend.reduce((sum,row)=>sum+row.sales,0),100);
  assert.deepEqual(result.topProducts,[{name:'Juice',units:2,sales:100}]);
  assert.deepEqual(result.categorySales,[{name:'Juice',value:100}]);
  assert.equal(store.sales[0].productName,'Juse');
});
test('refunds reverse original cost and profit, including refunds of older sales', () => {
  const refund={saleId:'s',quantity:1,total:50,createdAt:'2026-10-10T10:00:00Z'};
  assert.deepEqual(financials([sale],[refund]), {revenue:50,refunds:50,cogs:30,grossProfit:20});
  const result=buildAnalytics({...store,sales:[sale],refunds:[refund]},'month','2026-10-26T09:00:00Z');
  assert.equal(result.totals.grossProfit,-20); assert.equal(result.totals.cogs,-30);
  assert.equal(result.salesTrend.reduce((sum,row)=>sum+row.profit,0),-20);
});
test('cashier analytics never infer profit from missing cost', () => {
  const {profit,...cashierSale}=sale;
  const result=buildAnalytics({...store,sales:[cashierSale]},'all','2026-10-26T09:00:00Z');
  assert.equal(result.totals.grossProfit,null);
  assert.ok(result.salesTrend.every(row=>!('profit' in row)));
});
test('empty periods have zero activity and long ranges have readable monthly buckets', () => {
  const result=buildAnalytics({products:[],sales:[],refunds:[]},'month','2026-10-26T09:00:00Z');
  assert.equal(result.sales.length,0);assert.equal(result.totals.revenue,0);
  const long=buildAnalytics({...store,sales:[{...sale,createdAt:'2025-01-01T00:00:00Z'}]},'all','2026-10-26T09:00:00Z');
  assert.equal(long.salesTrend.length,22);
});
