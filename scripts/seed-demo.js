// Optional portfolio dataset. Never targets the application's configured database.
require('dotenv').config();
const {MongoClient}=require('mongodb');
const crypto=require('crypto');
async function main() {
 const name=process.env.MONGODB_DEMO_DB;
 if(!name || !name.endsWith('_demo') || name===(process.env.MONGODB_DB || 'hanzalah_supermarket')) throw new Error('Set MONGODB_DEMO_DB to a separate database name ending in _demo.');
 if(!process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length<12) throw new Error('Set DEMO_PASSWORD to at least 12 characters for the demo staff accounts.');
 if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
 const client=new MongoClient(process.env.MONGODB_URI);
 try {
  await client.connect();const db=client.db(name);
  for(const {name:collection} of await db.listCollections().toArray()) if(await db.collection(collection).countDocuments()) throw new Error('Demo database is not empty. Refusing to mix or overwrite records.');
  const users=[['admin','Demo Owner','admin'],['manager','Demo Manager','manager'],['cashier','Demo Cashier','cashier'],['cashier2','Demo Cashier Two','cashier']].map(([username,name,role])=>{
   const salt=crypto.randomBytes(16).toString('hex');
   return {id:`demo_${username}`,username,name,role,active:true,demo:true,passwordHash:`${salt}:${crypto.pbkdf2Sync(process.env.DEMO_PASSWORD,salt,100000,64,'sha512').toString('hex')}`};
  });
  const products=[['Rice 5kg','Groceries',320,390],['Fresh milk 1L','Dairy',55,70],['Orange juice 1L','Beverages',75,95],['Hand soap','Household',30,45],['Black tea 250g','Groceries',90,120],['Apples 1kg','Produce',60,85]].map(([name,category,cost,price],index)=>({id:`demo_p${index}`,name,category,cost,price,stock:index===0?4:40+index*8,minStock:10,sku:`DEMO-${index}`,barcode:`99000000000${index}`,supplierId:'demo_supplier',demo:true}));
  const sales=[];
  for(let daysAgo=59;daysAgo>=0;daysAgo--) {
   const day=new Date(Date.now()-daysAgo*86400000);
   for(let i=0;i<3+daysAgo%5;i++) {
    const product=products[(daysAgo+i)%products.length],staff=users[2+i%2],quantity=1+(daysAgo+i)%4;
    day.setUTCHours(5+i,20,0,0);
    sales.push({id:`demo_sale_${daysAgo}_${i}`,productId:product.id,productName:product.name,customerId:`demo_c${i%3}`,quantity,unitPrice:product.price,total:quantity*product.price,profit:quantity*(product.price-product.cost),cashierId:staff.id,cashierName:staff.name,paymentMethod:'Cash',createdAt:day.toISOString(),demo:true});
   }
  }
  const customers=['Demo · Ahmad Rahimi','Demo · Maryam Ahmadi','Demo · Farid Noori'].map((name,i)=>({id:`demo_c${i}`,name,phone:'',email:'',address:'',demo:true}));
  const orders=customers.map((customer,i)=>{
   const product=products[i*2],quantity=i+1,createdAt=new Date(Date.now()-i*86400000).toISOString();
   return {id:`DEMO-ORDER-${i}`,customer:customer.name,createdBy:users[2].id,status:['pending','shipped','delivered'][i],date:createdAt.slice(0,10),total:product.price*quantity,items:[{name:product.name,quantity,price:product.price}],createdAt,demo:true};
  });
  for(const [collection,values] of Object.entries({products,users,sales,customers,orders,suppliers:[{id:'demo_supplier',name:'Demo Wholesale Supply',phone:'',email:'',address:'',demo:true}],settings:[{id:'store',storeName:'Hanzala Supermarket · Demo',currency:'AFN',receiptFooter:'DEMO RECEIPT — SAMPLE DATA',demo:true}]})) await db.collection(collection).insertMany(values);
  console.log(`Demo sample data created in ${name}. To view it, explicitly start the app with MONGODB_DB=${name}.`);
 } finally {await client.close();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
