const express = require("express");
const db = require("../db/connection");

const router = express.Router();

router.get("/", (req, res) => {
  db.all(
    `
    SELECT works.*, clients.name AS client_name
    FROM works
    LEFT JOIN clients ON works.client_id = clients.id
    ORDER BY works.id DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao buscar obras" });
      }

      res.json(rows);
    }
  );
});

router.post("/", (req, res) => {
  const { client_id, name, location, status, start_date, end_date, notes } = req.body;

  if (!client_id || !name) {
    return res.status(400).json({ error: "client_id e name são obrigatórios" });
  }

  db.run(
    `
    INSERT INTO works (client_id, name, location, status, start_date, end_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [client_id, name, location || null, status || "planejamento", start_date || null, end_date || null, notes || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Erro ao criar obra" });
      }

      res.status(201).json({
        message: "Obra criada com sucesso",
        id: this.lastID
      });
    }
  );
});

module.exports = router;