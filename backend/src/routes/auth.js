const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = (pool) => {
  const r = Router();

  // POST /api/auth/register
  r.post("/register", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "E-Mail und Passwort erforderlich" });

    const hash = await bcrypt.hash(password, 12);
    try {
      const { rows: [user] } = await pool.query(
        "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
        [email, hash, name]
      );
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({ user, token });
    } catch (e) {
      if (e.code === "23505") return res.status(409).json({ error: "E-Mail bereits vergeben" });
      throw e;
    }
  });

  // POST /api/auth/login
  r.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const { rows: [user] } = await pool.query(
      "SELECT * FROM users WHERE email = $1", [email]
    );
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Ungültige Anmeldedaten" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  });

  return r;
};
