const { Router } = require("express");

module.exports = (pool) => {
  const r = Router();

  // GET Tasks (mit Filter)
  r.get("/", async (req, res) => {
    const { project_id, status, priority, assignee, group_by } = req.query;
    const conditions = [];
    const values = [];
    if (project_id) { conditions.push(`t.project_id = $${values.length+1}`); values.push(project_id); }
    if (status)     { conditions.push(`t.status = $${values.length+1}`); values.push(status); }
    if (priority)   { conditions.push(`t.priority = $${values.length+1}`); values.push(priority); }
    if (assignee)   { conditions.push(`t.assignee = $${values.length+1}`); values.push(assignee); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderCol = group_by === "priority" ? "t.priority" :
                     group_by === "status"   ? "t.status" :
                     group_by === "assignee" ? "t.assignee" : "t.position";

    const { rows } = await pool.query(
      `SELECT t.*, p.name AS project_name FROM tasks t
       JOIN projects p ON p.id = t.project_id
       ${where}
       ORDER BY ${orderCol}, t.deadline ASC NULLS LAST`,
      values
    );
    res.json(rows);
  });

  // POST neue Aufgabe
  r.post("/", async (req, res) => {
    const { project_id, name, description, status, priority, assignee,
            deadline, start_date, depends_on, position, checklist } = req.body;
    const { rows: [t] } = await pool.query(
      `INSERT INTO tasks
        (project_id, name, description, status, priority, assignee,
         deadline, start_date, depends_on, position, checklist)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [project_id, name, description,
       status || "new", priority || "medium", assignee,
       deadline, start_date, depends_on || [], position || 0,
       JSON.stringify(checklist || [])]
    );
    res.status(201).json(t);
  });

  // PATCH Aufgabe (inkl. Gantt-Drag)
  r.patch("/:id", async (req, res) => {
    const fields = ["name","description","status","priority","assignee",
                    "deadline","start_date","depends_on","position","checklist","progress"];
    const updates = fields.filter(f => req.body[f] !== undefined);
    if (!updates.length) return res.status(400).json({ error: "Keine Felder" });

    const setClause = updates.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const values = updates.map(f =>
      ["checklist","depends_on"].includes(f) ? JSON.stringify(req.body[f]) : req.body[f]
    );

    const { rows: [t] } = await pool.query(
      `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );

    // Abhängigkeiten neu berechnen wenn Datum geändert
    if (req.body.start_date || req.body.deadline) {
      await recalcDependencies(pool, req.params.id);
    }

    res.json(t);
  });

  // DELETE
  r.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
    res.status(204).end();
  });

  return r;
};

// Automatische Neuberechnung von Abhängigkeiten
async function recalcDependencies(pool, changedTaskId) {
  const { rows: changed } = await pool.query(
    "SELECT * FROM tasks WHERE id = $1", [changedTaskId]
  );
  if (!changed[0]) return;

  const { rows: dependents } = await pool.query(
    "SELECT * FROM tasks WHERE $1 = ANY(depends_on)", [changedTaskId]
  );

  for (const dep of dependents) {
    const newStart = changed[0].deadline;
    const duration = dep.deadline
      ? Math.ceil((new Date(dep.deadline) - new Date(dep.start_date)) / 86400000)
      : 1;
    const newDeadline = new Date(newStart);
    newDeadline.setDate(newDeadline.getDate() + duration);

    await pool.query(
      "UPDATE tasks SET start_date=$1, deadline=$2, updated_at=NOW() WHERE id=$3",
      [newStart, newDeadline, dep.id]
    );
    await recalcDependencies(pool, dep.id);
  }
}
