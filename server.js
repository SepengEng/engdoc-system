require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth");
const clientsRoutes = require("./routes/clients");
const worksRoutes = require("./routes/works");
const documentsRoutes = require("./routes/documents");
const liveDocRoutes = require("./routes/liveDoc");
const quotesRoutes = require("./routes/quotes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

fs.mkdirSync(path.join(__dirname, "generated", "pdf"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "generated", "txt"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "uploads", "originals"), { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.static(path.join(__dirname, "public"), { index: false }));
app.use("/generated", express.static(path.join(__dirname, "generated")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

console.log("authRoutes:", typeof authRoutes);
console.log("clientsRoutes:", typeof clientsRoutes);
console.log("worksRoutes:", typeof worksRoutes);
console.log("documentsRoutes:", typeof documentsRoutes);
console.log("liveDocRoutes:", typeof liveDocRoutes);
console.log("quotesRoutes:", typeof quotesRoutes);
console.log("authMiddleware:", typeof authMiddleware);

app.use("/auth", authRoutes);
app.use("/clients", authMiddleware, clientsRoutes);
app.use("/works", authMiddleware, worksRoutes);
app.use("/documents", authMiddleware, documentsRoutes);
app.use("/external-documents", authMiddleware, liveDocRoutes);
app.use("/quotes", authMiddleware, quotesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});