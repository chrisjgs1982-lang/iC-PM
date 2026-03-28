const { Router } = require("express");
const asyncHandler = require("../middleware/asyncHandler");

module.exports = (pool) => {
  const r = Router();

  let openai = null;
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // POST /ai/generate-tasks
  r.post("/generate-tasks", asyncHandler(async (req, res) => {
    if (!openai) return res.status(503).json({ error: "KI nicht konfiguriert (kein OPENAI_API_KEY)" });
    const { description, project_id } = req.body;
    if (!description) return res.status(400).json({ error: "description erforderlich" });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `Du bist ein Projektmanager-Assistent. Erstelle aus einer Projektbeschreibung
          eine strukturierte Liste von Aufgaben mit Start-/Enddatum, Priorität, Abhängigkeiten
          und Verantwortlichem. Antworte NUR als JSON-Objekt mit einem "tasks"-Array.` },
        { role: "user", content: `Projektbeschreibung: ${description}\nHeute ist: ${new Date().toISOString().split("T")[0]}\nMax. 10 Aufgaben.` }
      ],
      response_format: { type: "json_object" }
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  }));

  // POST /ai/risk-analysis
  r.post("/risk-analysis", asyncHandler(async (req, res) => {
    if (!openai) return res.status(503).json({ error: "KI nicht konfiguriert" });
    const { project_id } = req.body;
    if (!project_id) return res.status(400).json({ error: "project_id erforderlich" });

    const { rows: tasks } = await pool.query(
      "SELECT name, status, priority, deadline, assignee FROM tasks WHERE project_id = $1",
      [project_id]
    );
    const overdue = tasks.filter(t =>
      t.deadline && new Date(t.deadline) < new Date() && t.status !== "done"
    );
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein Risikoanalyst für Projekte. Antworte auf Deutsch als JSON-Objekt." },
        { role: "user", content: `Alle Aufgaben: ${JSON.stringify(tasks)}\nÜberfällig: ${JSON.stringify(overdue)}\nIdentifiziere Risiken, Engpässe und Handlungsempfehlungen.` }
      ],
      response_format: { type: "json_object" }
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  }));

  // POST /ai/prioritize
  r.post("/prioritize", asyncHandler(async (req, res) => {
    const { project_id } = req.body;
    if (!project_id) return res.status(400).json({ error: "project_id erforderlich" });

    if (!openai) {
      // Fallback ohne KI
      const { rows } = await pool.query(
        `SELECT id, name, deadline, priority, status FROM tasks
         WHERE project_id = $1 AND status != 'done'
         ORDER BY deadline ASC NULLS LAST,
           CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
        [project_id]
      );
      return res.json({ tasks: rows, ai_used: false });
    }

    const { rows: tasks } = await pool.query(
      "SELECT * FROM tasks WHERE project_id = $1 AND status != 'done'",
      [project_id]
    );
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Priorisiere Aufgaben nach Dringlichkeit. Antworte als JSON mit 'tasks' Array (id, new_priority, reason)." },
        { role: "user", content: JSON.stringify(tasks) }
      ],
      response_format: { type: "json_object" }
    });
    res.json({ ...JSON.parse(completion.choices[0].message.content), ai_used: true });
  }));

  return r;
};
