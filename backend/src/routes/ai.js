const { Router } = require("express");

module.exports = (pool) => {
  const r = Router();

  let openai = null;
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // POST /api/ai/generate-tasks — Gantt aus Beschreibung generieren
  r.post("/generate-tasks", async (req, res) => {
    if (!openai) return res.status(503).json({ error: "KI nicht konfiguriert (kein OPENAI_API_KEY)" });

    const { description, project_id } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `Du bist ein Projektmanager-Assistent. Erstelle aus einer Projektbeschreibung
          eine strukturierte Liste von Aufgaben mit Start-/Enddatum, Priorität, Abhängigkeiten
          und Verantwortlichem. Antworte NUR als JSON-Array.`
      }, {
        role: "user",
        content: `Projektbeschreibung: ${description}\nHeute ist: ${new Date().toISOString().split("T")[0]}\nErstelle max. 10 Aufgaben.`
      }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  });

  // POST /api/ai/risk-analysis — Risikoanalyse für ein Projekt
  r.post("/risk-analysis", async (req, res) => {
    if (!openai) return res.status(503).json({ error: "KI nicht konfiguriert" });

    const { rows: tasks } = await pool.query(
      "SELECT name, status, priority, deadline, assignee FROM tasks WHERE project_id = $1",
      [req.body.project_id]
    );

    const overdue = tasks.filter(t =>
      t.deadline && new Date(t.deadline) < new Date() && t.status !== "done"
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: "Du bist ein Risikoanalyst für Projekte. Antworte auf Deutsch als JSON."
      }, {
        role: "user",
        content: `Analysiere dieses Projekt:\nAlle Aufgaben: ${JSON.stringify(tasks)}\nÜberfällig: ${JSON.stringify(overdue)}\nIdentifiziere Risiken, Engpässe und gib Handlungsempfehlungen.`
      }],
      response_format: { type: "json_object" }
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  });

  // POST /api/ai/prioritize — KI-Priorisierung
  r.post("/prioritize", async (req, res) => {
    if (!openai) {
      // Fallback ohne KI: nach Deadline + überfällig sortieren
      const { rows } = await pool.query(
        `SELECT id, name, deadline, priority, status FROM tasks
         WHERE project_id = $1 AND status != 'done'
         ORDER BY deadline ASC NULLS LAST,
           CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
        [req.body.project_id]
      );
      return res.json({ tasks: rows, ai_used: false });
    }

    const { rows: tasks } = await pool.query(
      "SELECT * FROM tasks WHERE project_id = $1 AND status != 'done'",
      [req.body.project_id]
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: "Priorisiere Aufgaben nach Dringlichkeit und Wichtigkeit. Antworte als JSON mit 'tasks' Array (id, new_priority, reason)."
      }, {
        role: "user",
        content: JSON.stringify(tasks)
      }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ ...result, ai_used: true });
  });

  return r;
};
