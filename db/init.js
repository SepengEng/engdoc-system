const bcrypt = require("bcryptjs");
const db = require("./connection");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      contact_email TEXT,
      phone TEXT,
      city TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'planejamento',
      start_date TEXT,
      end_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS document_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      document_type_id INTEGER NOT NULL,
      work_id INTEGER,
      project_name TEXT NOT NULL,
      value REAL,
      status TEXT DEFAULT 'pendente',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (document_type_id) REFERENCES document_types(id),
      FOREIGN KEY (work_id) REFERENCES works(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS generated_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      document_type_id INTEGER NOT NULL,
      project_name TEXT NOT NULL,
      value REAL,
      description TEXT,
      generated_text TEXT,
      txt_file_path TEXT,
      pdf_file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (document_type_id) REFERENCES document_types(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS external_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      work_id INTEGER,
      title TEXT,
      original_file_name TEXT,
      stored_file_path TEXT,
      mime_type TEXT,
      extracted_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (work_id) REFERENCES works(id)
    )
  `);

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO document_types (id, name, code)
    VALUES (?, ?, ?)
  `);

  stmt.run(1, "Proposta", "PROPOSTA");
  stmt.run(2, "Contrato", "CONTRATO");
  stmt.run(3, "Medição", "MEDICAO");
  stmt.finalize();

  const adminPasswordHash = bcrypt.hashSync("123456", 10);

  db.run(
    `
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role)
    VALUES (1, 'Administrador', 'admin@empresa.com', ?, 'admin')
    `,
    [adminPasswordHash],
    (err) => {
      if (err) {
        console.error("Erro ao criar usuário admin:", err.message);
      } else {
        console.log("Banco inicializado com sucesso.");
        console.log("Login inicial: admin@empresa.com");
        console.log("Senha inicial: 123456");
      }

      db.close();
    }
  );
});