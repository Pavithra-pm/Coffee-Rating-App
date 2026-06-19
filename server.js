const express = require('express');
const path = require('path');
const { initDb } = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: convert sql.js result to array of objects
function rowsToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

// Bootstrap DB then start server
initDb().then(({ db, saveDb }) => {

  // GET all coffees
  app.get('/api/coffees', (req, res) => {
    try {
      const result = db.exec('SELECT * FROM coffees ORDER BY votes DESC');
      res.json(rowsToObjects(result));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch coffees' });
    }
  });

  // POST vote for a coffee
  app.post('/api/coffees/:id/vote', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
      const check = db.exec('SELECT * FROM coffees WHERE id = ?', [id]);
      if (!check || check.length === 0) {
        return res.status(404).json({ error: 'Coffee not found' });
      }

      db.run('UPDATE coffees SET votes = votes + 1 WHERE id = ?', [id]);
      saveDb(); // persist to disk

      const updated = db.exec('SELECT * FROM coffees WHERE id = ?', [id]);
      const coffee = rowsToObjects(updated)[0];
      res.json(coffee);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to record vote' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Coffee Rating app running at http://localhost:${PORT}`);
  });

}).catch(err => {
  console.error('Failed to initialise database:', err);
  process.exit(1);
});
