const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const db=require('../lib/database');
const handler=require('../api/[...path].js');
const {server}=require('../app');
const calls=[];
db.verifySession=async token=>['admin','manager','cashier'].includes(token)?{id:token,role:token}:null;
db.getStore=async user=>{calls.push(user);return {role:user.role};};
for(const name of ['createProduct','updateProduct','deleteProduct','createPurchase','createContact','updateContact','updateSettings','createUser','updateUser']) db[name]=async()=>({data:{ok:true}});
db.logout=async()=>({data:{ok:true}});
const ready=new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
after(()=>new Promise(resolve=>server.close(resolve)));
async function request(serverless,role,method,path,body={}) {
 if(serverless) {
   const req={method,query:{path:path.split('/')},headers:{authorization:role?`Bearer ${role}`:''},body};
   const res={status(code){this.code=code;return this;},json(data){this.data=data;return this;}};
   await handler(req,res);return {status:res.code,body:res.data};
 }
 await ready;
 const result=await fetch(`http://127.0.0.1:${server.address().port}/api/${path}`,{method,headers:{authorization:role?`Bearer ${role}`:'','Content-Type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(body)})});
 return {status:result.status,body:await result.json()};
}
for(const serverless of [false,true]) {
 const name=serverless?'serverless':'local HTTP';
 test(`${name}: unauthenticated store requests are rejected`,async()=>assert.equal((await request(serverless,'','GET','store')).status,401));
 test(`${name}: authenticated role is forwarded to the store data service`,async()=>{
  for(const role of ['admin','manager','cashier']){const result=await request(serverless,role,'GET','store');assert.equal(result.body.role,role);assert.equal(calls.at(-1).id,role);}
 });
 test(`${name}: cashier direct requests cannot mutate inventory, suppliers, staff or settings`,async()=>{
  for(const [method,path,body] of [['POST','products',{}],['PUT','products/p',{}],['DELETE','products/p',{}],['POST','purchases',{}],['POST','contacts',{type:'supplier'}],['PUT','contacts/s',{type:'supplier'}],['POST','users',{}],['PUT','users/u',{}],['PUT','settings',{}]]) assert.equal((await request(serverless,'cashier',method,path,body)).status,403,`${method} ${path}`);
 });
 test(`${name}: manager can run operations but cannot manage staff, settings or delete products`,async()=>{
  for(const path of ['products','purchases','contacts']) assert.equal((await request(serverless,'manager','POST',path,{type:'supplier'})).status,200);
  for(const [method,path] of [['POST','users'],['PUT','settings'],['DELETE','products/p']]) assert.equal((await request(serverless,'manager',method,path)).status,403);
  assert.equal((await request(serverless,'admin','PUT','settings')).status,200);
 });
 test(`${name}: authenticated logout endpoint is available`,async()=>assert.equal((await request(serverless,'cashier','POST','auth/logout')).status,200));
}
