const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const sqlite3 = require('sqlite3');

async function freePort() {
    const server=net.createServer();
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const port=server.address().port;
    await new Promise(resolve=>server.close(resolve));
    return port;
}
async function withDatabase(file, fn) {
    const db=new sqlite3.Database(file);
    const run=(sql)=>new Promise((resolve,reject)=>db.exec(sql,err=>err?reject(err):resolve()));
    const all=(sql)=>new Promise((resolve,reject)=>db.all(sql,(err,rows)=>err?reject(err):resolve(rows)));
    try {return await fn(run,all);} finally {await new Promise((resolve,reject)=>db.close(err=>err?reject(err):resolve()));}
}
async function launch(t,file) {
    const port=await freePort();
    const child=spawn(process.execPath,['server.js'],{
        cwd:path.resolve(__dirname,'..'),
        env:{...process.env,NODE_ENV:'test',HOST:'127.0.0.1',PORT:String(port),DATABASE_PATH:file,
            ADMIN_USERNAME:'test-admin',ADMIN_PASSWORD:'test-admin-password',VISITOR_USERNAME:'test-visitor',VISITOR_PASSWORD:'test-visitor-password'},
        stdio:['ignore','pipe','pipe']
    });
    let output='';
    child.stdout.on('data',chunk=>{output+=chunk;});child.stderr.on('data',chunk=>{output+=chunk;});
    t.after(async()=>{
        if(child.exitCode===null && child.signalCode===null){const stopped=new Promise(resolve=>child.once('exit',resolve));child.kill();await stopped;}
        await fs.rm(path.dirname(file),{recursive:true,force:true,maxRetries:5,retryDelay:100});
    });
    const base=`http://127.0.0.1:${port}`;
    const deadline=Date.now()+10000;
    while(true) {
        try { const res=await fetch(base+'/api/auth/status');if(res.ok)break; } catch {}
        if(child.exitCode!==null || Date.now()>deadline)throw new Error('Startup failed: '+output);
        await new Promise(resolve=>setTimeout(resolve,50));
    }
    return async function request(url,method='GET',body,cookie) {
        const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),redirect:'manual'});
        return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
    };
}

test('fresh startup, access control, persisted amounts and session revocation',async t=>{
    const folder=await fs.mkdtemp(path.join(os.tmpdir(),'flap-cost-test-'));
    const request=await launch(t,path.join(folder,'fresh.sqlite'));
    await t.test('unauthenticated business request is rejected',async()=>{
        assert.equal((await request('/api/quotations')).status,401);
    });
    const admin=await request('/api/auth/login','POST',{username:'test-admin',password:'test-admin-password'});
    assert.equal(admin.status,200);assert.ok(admin.cookie);
    const visitor=await request('/api/auth/login','POST',{username:'test-visitor',password:'test-visitor-password'});
    assert.equal(visitor.status,200);
    await t.test('visitor can read specs but cannot access quotations or modify prices',async()=>{
        assert.equal((await request('/api/specs','GET',undefined,visitor.cookie)).status,200);
        assert.equal((await request('/api/quotations','GET',undefined,visitor.cookie)).status,403);
        assert.equal((await request('/api/sandpaper','POST',{abrasive:'DEMO',material_no:'DEMO',grit:'P80',price:10},visitor.cookie)).status,403);
    });
    const quote={remark:'虚构测试报价',abrasive:'DEMO',width:20,length:30,pages:50,
        sandpaper_amount:0.03,sandpaper_cost:0.3,material_cost_tax:0.95,material_cost_no_tax:0.95/1.13,
        other_cost:0.45,total_cost_tax_shipping:1.4585,profit_rate:10,profit:0.14585,sale_price:1.60435,no_invoice:1.60435/1.08,
        profit_rate_2:20,profit_2:0.2917,sale_price_2:1.7502,no_invoice_2:1.7502/1.08};
    await t.test('two quotation amounts round trip without Boolean conversion',async()=>{
        const saved=await request('/api/quotations','POST',quote,admin.cookie);
        assert.equal(saved.status,200);
        const records=await request('/api/quotations','GET',undefined,admin.cookie);
        assert.equal(records.body.length,1);
        assert.equal(records.body[0].no_invoice,quote.no_invoice);
        assert.equal(records.body[0].no_invoice_2,quote.no_invoice_2);
    });
    await t.test('invalid quotation is rejected',async()=>{
        assert.equal((await request('/api/quotations','POST',{...quote,pages:0.5},admin.cookie)).status,400);
        assert.equal((await request('/api/quotations','POST',{...quote,no_invoice:null},admin.cookie)).status,400);
        assert.equal((await request('/api/quotations','POST',{},admin.cookie)).status,400);
    });
    await t.test('changing password invalidates all earlier administrator sessions',async()=>{
        const other=await request('/api/auth/login','POST',{username:'test-admin',password:'test-admin-password'});
        assert.equal((await request('/api/auth/change-password','POST',{currentPassword:'test-admin-password',newPassword:'test-new-password'},admin.cookie)).status,200);
        assert.equal((await request('/api/quotations','GET',undefined,admin.cookie)).status,401);
        assert.equal((await request('/api/quotations','GET',undefined,other.cookie)).status,401);
        assert.equal((await request('/api/auth/login','POST',{username:'test-admin',password:'test-admin-password'})).status,401);
        assert.equal((await request('/api/auth/login','POST',{username:'test-admin',password:'test-new-password'})).status,200);
    });
});

test('legacy quotation schema gains missing fields while retaining records',async t=>{
    const folder=await fs.mkdtemp(path.join(os.tmpdir(),'flap-cost-legacy-'));
    const file=path.join(folder,'legacy.sqlite');
    await withDatabase(file,run=>run(`CREATE TABLE quotations (id INTEGER PRIMARY KEY, remark TEXT); INSERT INTO quotations VALUES(1,'existing');`));
    await launch(t,file);
    await withDatabase(file,async(run,all)=>{
        const columns=await all('PRAGMA table_info(quotations)');
        for(const name of ['profit_rate_2','profit_2','sale_price_2','no_invoice_2'])assert.ok(columns.some(column=>column.name===name));
        assert.equal((await all('SELECT remark FROM quotations WHERE id=1'))[0].remark,'existing');
    });
});
