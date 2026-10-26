const {test}=require('node:test');
const assert=require('node:assert/strict');
const {storeFor,productFor,saleFor}=require('../lib/access');
const admin={id:'a',role:'admin'},manager={id:'m',role:'manager'},cashier={id:'c',role:'cashier'};
const store={products:[{id:'p',cost:50,price:70,stock:2,minStock:5,supplierId:'secret'}],customers:[],suppliers:[{id:'supplier'}],sales:[{id:'own',cashierId:'c',total:70,profit:20},{id:'other',cashierId:'d',total:90,profit:40},{id:'legacy',total:100,profit:40}],orders:[{id:'own',createdBy:'c'},{id:'other',createdBy:'d'},{id:'legacy'}],refunds:[{id:'r',saleId:'own',costReturned:50},{id:'hidden',saleId:'other'}],purchases:[{total:100}],users:[{id:'u'}],audits:[{detail:'secret'}],settings:{storeName:'Store',currency:'AFN',receiptFooter:'Thanks',internal:'secret'},summary:{profit:900},notifications:[]};
test('cashiers see only their own sales, orders, refunds; unassigned legacy records stay private',()=>{
 const result=storeFor(store,cashier);
 assert.deepEqual(result.sales.map(row=>row.id),['own']);assert.deepEqual(result.orders.map(row=>row.id),['own']);assert.deepEqual(result.refunds.map(row=>row.id),['r']);
 const text=JSON.stringify(result);for(const key of ['"profit"','"cost"','costReturned','supplierId','internal','secret']) assert.ok(!text.includes(key),key);
 for(const key of ['purchases','suppliers','users','audits']) assert.deepEqual(result[key],[]);
});
test('admin has store management access; manager has operations without staff or audit records',()=>{
 assert.equal(storeFor(store,admin).users.length,1);const result=storeFor(store,manager);
 assert.equal(result.sales.length,3);assert.equal(result.purchases.length,1);assert.deepEqual(result.users,[]);assert.deepEqual(result.audits,[]);
});
test('barcode and checkout responses remove cost and profit for cashiers',()=>{
 assert.equal(productFor(store.products[0],cashier).cost,undefined);
 assert.equal(saleFor(store.sales[0],cashier).profit,undefined);
 assert.equal(productFor(store.products[0],admin).cost,50);
});
test('unknown and unauthenticated roles cannot request a store',()=>{
 assert.throws(()=>storeFor(store,{role:'owner'}));assert.throws(()=>storeFor(store,null));
});
