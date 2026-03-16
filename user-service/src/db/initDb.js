const fs = require('fs/promises');
const path = require('path');
const db = require('./db');

async function initDb() {
  const sqlPath = path.join(process.cwd(), 'init.sql');
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);
}

module.exports = { initDb };