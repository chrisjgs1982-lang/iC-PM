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

app.listen(PORT, () => console.log(`iC-PM Backend läuft auf Port ${PORT}`));
