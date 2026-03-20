require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./connection");

async function init() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        contact_email TEXT,
        phone TEXT,
        city TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS works (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        location TEXT,
        status TEXT DEFAULT 'planejamento',
        start_date TEXT,
        end_date TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS document_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        document_type_id INTEGER NOT NULL REFERENCES document_types(id),
        work_id INTEGER REFERENCES works(id) ON DELETE SET NULL,
        project_name TEXT NOT NULL,
        value NUMERIC,
        status TEXT DEFAULT 'pendente',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS document_attachments (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        original_file_name TEXT,
        stored_file_path TEXT,
        mime_type TEXT,
        extracted_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        project_name TEXT NOT NULL,
        value NUMERIC,
        status TEXT DEFAULT 'negociacao',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS quote_attachments (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        original_file_name TEXT,
        stored_file_path TEXT,
        mime_type TEXT,
        extracted_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS external_documents (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        work_id INTEGER REFERENCES works(id) ON DELETE SET NULL,
        title TEXT,
        original_file_name TEXT,
        stored_file_path TEXT,
        mime_type TEXT,
        extracted_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      INSERT INTO document_types (name, code)
      VALUES
        ('Proposta Simples', 'PROPOSTA_SIMPLES'),
        ('Proposta Detalhada', 'PROPOSTA_DETALHADA'),
        ('Medição de Obra', 'MEDICAO_OBRA'),
        ('Contrato', 'CONTRATO')
      ON CONFLICT (code) DO NOTHING
    `);

    const adminPassword = bcrypt.hashSync("123456", 10);

    await db.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ["Administrador", "admin@empresa.com", adminPassword, "admin"]);

    console.log("Banco PostgreSQL inicializado com sucesso.");
    console.log("Login inicial: admin@empresa.com");
    console.log("Senha inicial: 123456");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao inicializar banco:", error);
    process.exit(1);
  }
}

init();