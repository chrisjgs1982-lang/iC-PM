require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// DB Pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/projects",   require("./routes/projects")(pool));
app.use("/tasks",      require("./routes/tasks")(pool));
app.use("/ai",         require("./routes/ai")(pool));
app.use("/reports",    require("./routes/reports")(pool));
app.use("/auth",       require("./routes/auth")(pool));

// Health
app.get("/health", (_, res) => res.json({ status: "ok", ts: new Date() }));

// Global Error Handler — verhindert 502 bei unbehandelten Fehlern
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (err.code === "22P02") return res.status(400).json({ error: "Ungültige ID (kein gültiger UUID)" });
  if (err.code === "23505") return res.status(409).json({ error: "Eintrag bereits vorhanden" });
  if (err.code === "23503") return res.status(404).json({ error: "Referenzierter Datensatz nicht gefunden" });
  res.status(500).json({ error: err.message || "Interner Serverfehler" });
});

app.listen(PORT, () => console.log(`iC-PM Backend läuft auf Port ${PORT}`));
