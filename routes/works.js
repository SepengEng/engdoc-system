const express = require("express");
const db = require("../db/connection");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT works.*, clients.name AS client_name
      FROM works
      LEFT JOIN clients ON works.client_id = clients.id
      ORDER BY works.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar obras" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      client_id,
      name,
      location,
      status,
      start_date,
      end_date,
      notes
    } = req.body;

    if (!client_id || !name) {
      return res.status(400).json({ error: "client_id e name são obrigatórios" });
    }

    const result = await db.query(
      `
      INSERT INTO works (client_id, name, location, status, start_date, end_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [client_id, name, location || null, status || null, start_date || null, end_date || null, notes || null]
    );

    res.json({
      message: "Obra criada com sucesso",
      id: result.rows[0].id
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar obra" });
  }
});

module.exports = router;