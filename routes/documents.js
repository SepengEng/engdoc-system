const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const db = require("../db/connection");
const { buildDocumentText } = require("../services/aiDocumentGenerator");
const { extractText } = require("../services/externalDocumentService");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads/originals",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

function sanitizeFileName(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function createPdf(filePath, title, content) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(18).text(title);
    doc.moveDown();
    doc.fontSize(12).text(content, { lineGap: 4 });
    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

router.get("/types", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM document_types ORDER BY id`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const docsResult = await db.query(`
      SELECT
        d.*,
        c.name AS client_name,
        dt.name AS document_type
      FROM documents d
      JOIN clients c ON c.id = d.client_id
      JOIN document_types dt ON dt.id = d.document_type_id
      ORDER BY d.id DESC
    `);

    const attachmentsResult = await db.query(`
      SELECT * FROM document_attachments ORDER BY id DESC
    `);

    const docs = docsResult.rows.map((doc) => ({
      ...doc,
      attachments: attachmentsResult.rows.filter((a) => a.document_id === doc.id)
    }));

    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", upload.array("files", 20), async (req, res) => {
  try {
    const {
      client_id,
      document_type_id,
      project_name,
      value,
      status,
      description
    } = req.body;

    if (!client_id || !document_type_id || !project_name) {
      return res.status(400).json({
        error: "client_id, document_type_id e project_name são obrigatórios"
      });
    }

    const docResult = await db.query(
      `
      INSERT INTO documents (
        client_id,
        document_type_id,
        project_name,
        value,
        status,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        client_id,
        document_type_id,
        project_name,
        value || null,
        status || "pendente",
        description || null
      ]
    );

    const documentId = docResult.rows[0].id;
    const files = req.files || [];

    for (const file of files) {
      const extractedText = await extractText(file.path, file.mimetype);

      await db.query(
        `
        INSERT INTO document_attachments (
          document_id,
          original_file_name,
          stored_file_path,
          mime_type,
          extracted_text
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [documentId, file.originalname, file.path, file.mimetype, extractedText]
      );
    }

    res.status(201).json({
      message: "Documento criado com sucesso",
      documentId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/generate-ai", async (req, res) => {
  try {
    const {
      client_id,
      document_type_id,
      project_name,
      value,
      description
    } = req.body;

    if (!client_id || !document_type_id || !project_name) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const clientResult = await db.query(
      `SELECT * FROM clients WHERE id = $1 LIMIT 1`,
      [client_id]
    );
    const typeResult = await db.query(
      `SELECT * FROM document_types WHERE id = $1 LIMIT 1`,
      [document_type_id]
    );

    const client = clientResult.rows[0];
    const type = typeResult.rows[0];

    if (!client) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    if (!type) {
      return res.status(404).json({ error: "Tipo não encontrado" });
    }

    const text = buildDocumentText({
      client,
      documentType: type,
      projectName: project_name,
      value,
      description
    });

    const baseName = sanitizeFileName(`${project_name}_${Date.now()}`);
    const txtPath = path.join(__dirname, "..", "generated", "txt", `${baseName}.txt`);
    const pdfPath = path.join(__dirname, "..", "generated", "pdf", `${baseName}.pdf`);

    fs.writeFileSync(txtPath, text, "utf8");
    await createPdf(pdfPath, project_name, text);

    res.json({
      text,
      txt: `/generated/txt/${baseName}.txt`,
      pdf: `/generated/pdf/${baseName}.pdf`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;