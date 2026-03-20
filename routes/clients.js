const express = require("express");
const db = require("../db/connection");

const router = express.Router();

router.get("/", (req, res) => {
  const search = (req.query.search || "").trim();
  const searchValue = `%${search}%`;

  db.all(
    `
    SELECT *
    FROM clients
    WHERE name LIKE ? OR category LIKE ? OR city LIKE ?
    ORDER BY id DESC
    `,
    [searchValue, searchValue, searchValue],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

router.get("/:id", (req, res) => {
  db.get(`SELECT * FROM clients WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json(row);
  });
});

router.post("/", (req, res) => {
  const { name, category, contact_email, phone, city, notes } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "name e category são obrigatórios" });
  }

  db.run(
    `
    INSERT INTO clients (name, category, contact_email, phone, city, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name, category, contact_email || null, phone || null, city || null, notes || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: "Cliente criado com sucesso",
        clientId: this.lastID
      });
    }
  );
});

module.exports = router;