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

router.get("/types", (req, res) => {
  db.all(`SELECT * FROM document_types ORDER BY id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get("/", (req, res) => {
  db.all(
    `
    SELECT
      d.*,
      c.name AS client_name,
      dt.name AS document_type
    FROM documents d
    JOIN clients c ON c.id = d.client_id
    JOIN document_types dt ON dt.id = d.document_type_id
    ORDER BY d.id DESC
    `,
    [],
    (err, docs) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!docs.length) return res.json([]);

      const ids = docs.map((d) => d.id);

      db.all(
        `
        SELECT * FROM document_attachments
        WHERE document_id IN (${ids.map(() => "?").join(",")})
        `,
        ids,
        (err2, attachments) => {
          if (err2) return res.status(500).json({ error: err2.message });

          const result = docs.map((doc) => ({
            ...doc,
            attachments: attachments.filter((a) => a.document_id === doc.id)
          }));

          res.json(result);
        }
      );
    }
  );
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

    db.run(
      `
      INSERT INTO documents (
        client_id,
        document_type_id,
        project_name,
        value,
        status,
        description
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        client_id,
        document_type_id,
        project_name,
        value || null,
        status || "pendente",
        description || null
      ],
      async function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const documentId = this.lastID;
        const files = req.files || [];

        for (const file of files) {
          const extractedText = await extractText(file.path, file.mimetype);

          await new Promise((resolve, reject) => {
            db.run(
              `
              INSERT INTO document_attachments (
                document_id,
                original_file_name,
                stored_file_path,
                mime_type,
                extracted_text
              )
              VALUES (?, ?, ?, ?, ?)
              `,
              [
                documentId,
                file.originalname,
                file.path,
                file.mimetype,
                extractedText
              ],
              (insertErr) => {
                if (insertErr) reject(insertErr);
                else resolve();
              }
            );
          });
        }

        res.status(201).json({
          message: "Documento criado com sucesso",
          documentId
        });
      }
    );
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
      return res.status(400).json({
        error: "Dados obrigatórios faltando"
      });
    }

    db.get(`SELECT * FROM clients WHERE id = ?`, [client_id], (err, client) => {
      if (!client) return res.status(404).json({ error: "Cliente não encontrado" });

      db.get(`SELECT * FROM document_types WHERE id = ?`, [document_type_id], async (err2, type) => {
        if (!type) return res.status(404).json({ error: "Tipo não encontrado" });

        const text = buildDocumentText({
          client,
          documentType: type,
          projectName: project_name,
          value,
          description
        });

        const baseName = sanitizeFileName(`${project_name}_${Date.now()}`);

        const txtPath = path.join(__dirname, "..", "generated/txt", `${baseName}.txt`);
        const pdfPath = path.join(__dirname, "..", "generated/pdf", `${baseName}.pdf`);

        fs.writeFileSync(txtPath, text, "utf8");
        await createPdf(pdfPath, project_name, text);

        res.json({
          text,
          txt: `/generated/txt/${baseName}.txt`,
          pdf: `/generated/pdf/${baseName}.pdf`
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;