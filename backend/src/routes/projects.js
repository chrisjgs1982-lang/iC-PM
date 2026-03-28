const { Router } = require("express");
const asyncHandler = require("../middleware/asyncHandler");

module.exports = (pool) => {
  const r = Router();

  // GET alle Projekte
  r.get("/", asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT p.*,
        COUNT(t.id) FILTER (WHERE t.status != 'done') AS open_tasks,
        COUNT(t.id) FILTER (WHERE t.deadline < NOW() AND t.status != 'done') AS overdue_tasks
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id ORDER BY p.created_at DESC`
    );
    res.json(rows);
  }));

  // GET einzelnes Projekt mit Tasks
  r.get("/:id", asyncHandler(async (req, res) => {
    const { rows: [project] } = await pool.query(
      "SELECT * FROM projects WHERE id = $1", [req.params.id]
    );
    if (!project) return res.status(404).json({ error: "Nicht gefunden" });
    const { rows: tasks } = await pool.query(
      `SELECT * FROM tasks WHERE project_id = $1 ORDER BY position, created_at`,
      [req.params.id]
    );
    res.json({ ...project, tasks });
  }));

  // POST neues Projekt
  r.post("/", asyncHandler(async (req, res) => {
    const { name, description, color, start_date, end_date, owner } = req.body;
    if (!name) return res.status(400).json({ error: "Name erforderlich" });
    const { rows: [p] } = await pool.query(
      `INSERT INTO projects (name, description, color, start_date, end_date, owner)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, description, color || "#3B82F6", start_date || null, end_date || null, owner]
    );
    res.status(201).json(p);
  }));

  // PATCH Projekt
  r.patch("/:id", asyncHandler(async (req, res) => {
    const fields = ["name","description","color","start_date","end_date","owner","status"];
    const updates = fields.filter(f => req.body[f] !== undefined);
    if (!updates.length) return res.status(400).json({ error: "Keine Felder angegeben" });
    const setClause = updates.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = updates.map(f => req.body[f]);
    const { rows: [p] } = await pool.query(
      `UPDATE projects SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );
    if (!p) return res.status(404).json({ error: "Nicht gefunden" });
    res.json(p);
  }));

  // DELETE Projekt
  r.delete("/:id", asyncHandler(async (req, res) => {
    await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
    res.status(204).end();
  }));

  return r;
};
