const express = require("express");
const db = require("../db/connection");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const searchValue = `%${search}%`;

    const result = await db.query(
      `
      SELECT *
      FROM clients
      WHERE name ILIKE $1 OR category ILIKE $1 OR city ILIKE $1
      ORDER BY id DESC
      `,
      [searchValue]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, category, contact_email, phone, city, notes } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: "name e category são obrigatórios" });
    }

    const result = await db.query(
      `
      INSERT INTO clients (name, category, contact_email, phone, city, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [name, category, contact_email || null, phone || null, city || null, notes || null]
    );

    res.status(201).json({
      message: "Cliente criado com sucesso",
      clientId: result.rows[0].id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;