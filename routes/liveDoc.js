const express = require("express");
const multer = require("multer");
const db = require("../db/connection");
const { extractText } = require("../services/externalDocumentService");
const { analyzeWithGPT, chatWithGPT } = require("../services/openaiService");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads/originals",
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

router.get("/", (req, res) => {
  db.all(`SELECT * FROM external_documents ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { client_id, title } = req.body;

    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const extractedText = await extractText(file.path, file.mimetype);

    db.run(
      `
      INSERT INTO external_documents (
        client_id,
        title,
        original_file_name,
        stored_file_path,
        mime_type,
        extracted_text
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        client_id || null,
        title || file.originalname,
        file.originalname,
        file.path,
        file.mimetype,
        extractedText
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
          message: "Documento enviado com sucesso",
          id: this.lastID
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/analyze", (req, res) => {
  const { id, prompt } = req.body;

  if (!id || !prompt) {
    return res.status(400).json({ error: "id e prompt são obrigatórios" });
  }

  db.get(`SELECT * FROM external_documents WHERE id = ?`, [id], async (err, doc) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!doc) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }

    try {
      const result = await analyzeWithGPT(doc.extracted_text || "", prompt);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

router.post("/chat", (req, res) => {
  const { id, message, history } = req.body;

  if (!id || !message) {
    return res.status(400).json({ error: "id e message são obrigatórios" });
  }

  db.get(`SELECT * FROM external_documents WHERE id = ?`, [id], async (err, doc) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!doc) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }

    try {
      const result = await chatWithGPT({
        documentText: doc.extracted_text || "",
        userMessage: message,
        history: Array.isArray(history) ? history : []
      });

      res.json({ result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

module.exports = router;