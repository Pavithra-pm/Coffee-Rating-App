const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'coffees.db');

let db = null;

// Persist db to disk on every write
function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();

  // Load existing db file or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create table
  db.run(`
    CREATE TABLE IF NOT EXISTS coffees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      origin TEXT NOT NULL,
      roast TEXT NOT NULL,
      votes INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Seed if empty
  const result = db.exec('SELECT COUNT(*) as count FROM coffees');
  const count = result[0]?.values[0][0] ?? 0;

  if (count === 0) {
    const coffees = [
      ['Espresso Royale', 'Bold and intense with a rich crema and notes of dark chocolate.', 'Ethiopia', 'Dark', 0],
      ['Morning Mist', 'Smooth and light with a floral aroma and hints of jasmine.', 'Colombia', 'Light', 0],
      ['Velvet Brew', 'Creamy body with caramel sweetness and a nutty finish.', 'Brazil', 'Medium', 0],
      ['Highland Peak', 'Crisp and bright with citrus notes and a clean finish.', 'Kenya', 'Medium-Light', 0],
      ['Midnight Blend', 'Deep and smoky with earthy undertones and a bold aftertaste.', 'Sumatra', 'Dark', 0],
      ['Golden Hour', 'Balanced and sweet with honey-like sweetness and berry hints.', 'Costa Rica', 'Medium', 0],
    ];

    const stmt = db.prepare(
      'INSERT INTO coffees (name, description, origin, roast, votes) VALUES (?, ?, ?, ?, ?)'
    );
    for (const row of coffees) {
      stmt.run(row);
    }
    stmt.free();
    saveDb();
    console.log('Database seeded with initial coffee data.');
  }

  return { db, saveDb };
}

module.exports = { initDb, saveDb: () => saveDb() };
