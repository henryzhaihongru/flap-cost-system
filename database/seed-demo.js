const db = require('./db');
const { initializeDatabase } = require('./init');
const run = (sql, args=[]) => new Promise((resolve,reject) => db.run(sql,args,err => err ? reject(err) : resolve()));
async function seed() {
    await initializeDatabase();
    await run('BEGIN IMMEDIATE');
    try {
        await run(`INSERT OR IGNORE INTO product_specs
            (spec,width,length,pieces,base_cost,glue_cost,label_cost,box_cost,labor_cost,management_cost,shipping_cost)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`, ['DEMO-100',20,30,50,0.5,0.1,0.02,0.03,0.2,0.1,0.15]);
        await run(`INSERT INTO sandpaper_prices (abrasive,material_no,grit,price,price_source,remark)
            SELECT ?,?,?,?,?,? WHERE NOT EXISTS
            (SELECT 1 FROM sandpaper_prices WHERE abrasive=? AND material_no=? AND grit=?)`,
            ['演示磨料','DEMO-A','P80',10,'DEMO','虚构数据，仅供演示','演示磨料','DEMO-A','P80']);
        await run('COMMIT');
        console.log('虚构演示数据已添加，未覆盖已有记录。');
    } catch (err) { await run('ROLLBACK'); throw err; }
}
seed().then(() => db.close()).catch(err => {console.error(err);db.close();process.exitCode=1;});
