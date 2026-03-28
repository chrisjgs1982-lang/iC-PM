const { Router } = require("express");

module.exports = (pool) => {
  const r = Router();

  // GET /api/reports/project/:id — Fortschrittsbericht
  r.get("/project/:id", async (req, res) => {
    const { rows: summary } = await pool.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'done') AS done,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'new') AS new_tasks,
        COUNT(*) FILTER (WHERE deadline < NOW() AND status != 'done') AS overdue,
        AVG(progress) AS avg_progress
       FROM tasks WHERE project_id = $1`,
      [req.params.id]
    );

    const { rows: by_assignee } = await pool.query(
      `SELECT assignee,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'done') AS done,
        COUNT(*) FILTER (WHERE deadline < NOW() AND status != 'done') AS overdue
       FROM tasks WHERE project_id = $1 AND assignee IS NOT NULL
       GROUP BY assignee ORDER BY total DESC`,
      [req.params.id]
    );

    const { rows: timeline } = await pool.query(
      `SELECT
        DATE_TRUNC('week', updated_at) AS week,
        COUNT(*) FILTER (WHERE status = 'done') AS completed
       FROM tasks WHERE project_id = $1
       GROUP BY week ORDER BY week`,
      [req.params.id]
    );

    res.json({ summary: summary[0], by_assignee, timeline });
  });

  // GET /api/reports/export/:id — Excel-Export Daten
  r.get("/export/:id", async (req, res) => {
    const { rows: project } = await pool.query(
      "SELECT * FROM projects WHERE id = $1", [req.params.id]
    );
    const { rows: tasks } = await pool.query(
      `SELECT
        t.name AS "Aufgabe",
        t.status AS "Status",
        t.priority AS "Priorität",
        t.assignee AS "Verantwortlich",
        t.start_date AS "Start",
        t.deadline AS "Deadline",
        t.progress AS "Fortschritt (%)",
        p.name AS "Projekt"
       FROM tasks t JOIN projects p ON p.id = t.project_id
       WHERE t.project_id = $1 ORDER BY t.position`,
      [req.params.id]
    );
    res.json({ project: project[0], tasks });
  });

  return r;
};
