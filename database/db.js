const path = require('node:path');
const fs = require('node:fs');
const sqlite3 = require('node:module').createRequire(path.join(__dirname,'../backend/package.json'))('sqlite3').verbose();
const dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(__dirname,'database.sqlite');
fs.mkdirSync(path.dirname(dbPath),{recursive:true});
const db = new sqlite3.Database(dbPath);
db.serialize(() => {
    db.run('PRAGMA journal_mode=WAL');
    db.run('PRAGMA busy_timeout=5000');
    db.run('PRAGMA foreign_keys=ON');
});
module.exports = db;
