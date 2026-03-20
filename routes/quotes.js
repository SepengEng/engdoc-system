const express = require("express");
const multer = require("multer");
const db = require("../db/connection");
const { extractText } = require("../services/externalDocumentService");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads/originals",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const quotesResult = await db.query(`
      SELECT q.*, c.name AS client_name
      FROM quotes q
      JOIN clients c ON c.id = q.client_id
      ORDER BY q.id DESC
    `);

    const attachmentsResult = await db.query(`
      SELECT * FROM quote_attachments ORDER BY id DESC
    `);

    const quotes = quotesResult.rows.map((quote) => ({
      ...quote,
      attachments: attachmentsResult.rows.filter((a) => a.quote_id === quote.id)
    }));

    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", upload.array("files", 20), async (req, res) => {
  try {
    const { client_id, project_name, value, status, description } = req.body;

    if (!client_id || !project_name) {
      return res.status(400).json({ error: "client_id e project_name são obrigatórios" });
    }

    const quoteResult = await db.query(
      `
      INSERT INTO quotes (client_id, project_name, value, status, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [client_id, project_name, value || null, status || "negociacao", description || null]
    );

    const quoteId = quoteResult.rows[0].id;
    const files = req.files || [];

    for (const file of files) {
      const extractedText = await extractText(file.path, file.mimetype);

      await db.query(
        `
        INSERT INTO quote_attachments (
          quote_id,
          original_file_name,
          stored_file_path,
          mime_type,
          extracted_text
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [quoteId, file.originalname, file.path, file.mimetype, extractedText]
      );
    }

    res.status(201).json({
      message: "Cotação criada com sucesso",
      quoteId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/win", async (req, res) => {
  try {
    const quoteId = req.params.id;

    const quoteResult = await db.query(
      `SELECT * FROM quotes WHERE id = $1 LIMIT 1`,
      [quoteId]
    );

    const quote = quoteResult.rows[0];

    if (!quote) {
      return res.status(404).json({ error: "Cotação não encontrada" });
    }

    const workResult = await db.query(
      `
      INSERT INTO works (client_id, name, status, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        quote.client_id,
        quote.project_name,
        "ativa",
        `Obra criada automaticamente a partir da cotação #${quote.id}`
      ]
    );

    await db.query(
      `UPDATE quotes SET status = 'aprovada' WHERE id = $1`,
      [quoteId]
    );

    res.json({
      message: "Cotação convertida em obra com sucesso",
      workId: workResult.rows[0].id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;