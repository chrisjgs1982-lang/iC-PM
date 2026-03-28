const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");

module.exports = (pool) => {
  const r = Router();

  r.post("/register", asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "E-Mail und Passwort erforderlich" });
    const hash = await bcrypt.hash(password, 12);
    const { rows: [user] } = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
      [email, hash, name]
    );
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ user, token });
  }));

  r.post("/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "E-Mail und Passwort erforderlich" });
    const { rows: [user] } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Ungültige Anmeldedaten" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  }));

  return r;
};
