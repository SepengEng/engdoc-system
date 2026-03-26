const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractText(filePath, mimeType) {
  try {
    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(dataBuffer);
      return parsed.text || "";
    }

    if (mimeType && mimeType.startsWith("text/")) {
      return fs.readFileSync(filePath, "utf8");
    }

    return `Extração de texto não suportada para este tipo de arquivo: ${mimeType}`;
  } catch (error) {
    return `Erro ao extrair texto: ${error.message}`;
  }
}

module.exports = { extractText };