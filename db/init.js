const pool = require("./connection");

async function init() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT
      );
    `);

    console.log("Banco inicializado com sucesso");
  } catch (err) {
    console.error("Erro ao inicializar banco:", err);
  }
}

init();