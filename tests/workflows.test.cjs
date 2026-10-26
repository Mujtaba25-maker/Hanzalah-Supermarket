// Exercise the real database service against an in-memory Mongo adapter.
// These checks never connect to or change the configured database.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const rows={products:[{id:'p',sku:'SKU',barcode:'12345',name:'Rice',category:'Food',stock:10,minStock:2,price:100,cost:60}],customers:[],suppliers:[],sales:[],orders:[],purchases:[],refunds:[],users:[{id:'c',name:'Cashier',role:'cashier',active:true}],sessions:[],audits:[],settings:[{id:'store',currency:'AFN',storeName:'Test'}]};
function matches(row,query) {
 return Object.entries(query).every(([key,value])=>{
  if(key==='$or') return value.some(option=>matches(row,option));
  if(value?.$gte!==undefined) return row[key]>=value.$gte;
  if(value?.$gt!==undefined) return row[key]>value.$gt;
  if(value?.$regex!==undefined) return new RegExp(value.$regex,value.$options).test(row[key]);
  return row[key]===value;
 });
}
const database={collection(name){return {
 createIndex:async()=>{},countDocuments:async()=>rows[name].length,
 find(query={}) {let found=rows[name].filter(row=>matches(row,query));return {sort(){return this;},limit(n){found=found.slice(0,n);return this;},toArray:async()=>structuredClone(found)};},
 findOne:async query=>structuredClone(rows[name].find(row=>matches(row,query)) || null),
 insertOne:async row=>{rows[name].push(structuredClone(row));return {insertedId:row.id};},
 insertMany:async values=>rows[name].push(...structuredClone(values)),
 updateOne:async(query,update)=>{const row=rows[name].find(row=>matches(row,query));if(!row)return {modifiedCount:0};Object.assign(row,update.$set);for(const [key,value]of Object.entries(update.$inc||{}))row[key]+=value;return {modifiedCount:1};},
 deleteOne:async query=>{const index=rows[name].findIndex(row=>matches(row,query));if(index>=0)rows[name].splice(index,1);return {deletedCount:index>=0?1:0};}
};}};
const mongoPath=require.resolve('mongodb');require(mongoPath);
require.cache[mongoPath].exports={MongoClient:class {async connect(){return this;}db(){return database;}}};
process.env.MONGODB_URI='mongodb://in-memory-test';
const db=require('../lib/database');
test('scanner lookup, checkout, stock, receipts, refund isolation and logout',async()=>{
 const cashier={id:'c',name:'Cashier',role:'cashier'},other={id:'other',role:'cashier'},admin={id:'a',role:'admin'};
 const product=await db.findProductByBarcode('12345',cashier);
 assert.equal(product.id,'p');assert.equal(product.cost,undefined);
 assert.equal((await db.findProductByBarcode('SKU',cashier)).id,'p');
 assert.equal(await db.findProductByBarcode('missing',cashier),null);
 const result=await db.createSale({productId:'p',quantity:2,unitPrice:1},cashier);
 assert.equal(result.status,201);assert.equal(result.data.total,200);assert.equal(result.data.profit,undefined);
 assert.equal(rows.products[0].stock,8);assert.equal(rows.sales[0].profit,80);
 const store=await db.getStore(cashier);
 assert.equal(store.sales[0].cashierId,'c');assert.equal(store.sales[0].total,200); // invoice inputs
 assert.equal((await db.getStore(other)).sales.length,0);
 assert.equal((await db.createRefund({saleId:result.data.id,quantity:1},other)).status,403);
 const refund=await db.createRefund({saleId:result.data.id,quantity:1},cashier);
 assert.equal(refund.status,201);assert.equal(refund.data.costReturned,undefined);assert.equal(rows.products[0].stock,9);
 assert.equal((await db.createRefund({saleId:result.data.id,quantity:2},cashier)).status,400);
 const management=await db.getStore(admin);
 assert.equal(management.summary.totalSales,100);assert.equal(management.summary.costOfGoodsSold,60);assert.equal(management.summary.totalProfit,40);
 const order=await db.createOrder({customer:'Buyer',status:'pending',total:100,date:'2026-10-26'},cashier);
 assert.equal(order.data.createdBy,'c');assert.equal((await db.getStore(other)).orders.length,0);
 assert.equal((await db.createSale({productId:'p',quantity:99},cashier)).status,400);
 rows.sessions.push({token:'test',userId:'c',expiresAt:new Date(Date.now()+60000)});
 assert.equal((await db.verifySession('test')).id,'c');await db.logout('test');assert.equal(await db.verifySession('test'),null);
});
