require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db/connection");

const users = [
  {
    name: "Admin",
    email: "admin@engdoc.com",
    password: "123456",
    role: "admin"
  }
];

async function createUsers() {
  try {
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);

      await pool.query(
        `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        `,
        [user.name, user.email, hash, user.role]
      );

      console.log(`Usuário ${user.email} criado ✅`);
    }

    console.log("Todos usuários criados 🚀");
  } catch (err) {
    console.error("Erro:", err.message);
  }

  process.exit();
}

createUsers();