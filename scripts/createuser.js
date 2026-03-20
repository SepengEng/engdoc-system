require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db/connection");

async function createUser() {
  const name = "Admin";
  const email = "admin@engdoc.com";
  const password = "123456";
  const role = "admin";

  try {
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      `,
      [name, email, hash, role]
    );

    console.log("Usuário criado com sucesso 🚀");
  } catch (err) {
    console.error("Erro ao criar usuário:", err.message);
  }

  process.exit();
}

createUser();