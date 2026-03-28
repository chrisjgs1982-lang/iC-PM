import { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ArrowLeft } from "lucide-react";

export default function GanttView() {
  const { id } = useParams();
  const ganttRef = useRef(null);
  const qc = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api(`/projects/${id}`),
  });

  const patchTask = useMutation({
    mutationFn: ({ taskId, data }) => api(`/tasks/${taskId}`, { method: "PATCH", body: data }),
    onSuccess: () => qc.invalidateQueries(["project", id]),
  });

  useEffect(() => {
    if (!project?.tasks || !ganttRef.current) return;

    import("dhtmlx-gantt").then(({ gantt }) => {
      // Konfiguration
      gantt.config.date_format = "%Y-%m-%d";
      gantt.config.drag_links  = true;
      gantt.config.drag_progress = true;
      gantt.config.auto_scheduling = true;
      gantt.config.scales = [
        { unit: "month", step: 1, format: "%F %Y" },
        { unit: "week",  step: 1, format: "KW%W" }
      ];

      // Spalten
      gantt.config.columns = [
        { name: "text",     label: "Aufgabe",   width: 200, tree: true },
        { name: "start_date", label: "Start",   width: 90, align: "center" },
        { name: "duration", label: "Dauer (T)", width: 60, align: "center" },
        { name: "progress", label: "Fortschritt", width: 80, align: "center",
          template: t => `${Math.round((t.progress || 0) * 100)}%` },
      ];

      // Farben je Status
      gantt.templates.task_class = (s, e, task) => {
        const map = { done: "gantt-done", overdue: "gantt-overdue", in_progress: "gantt-inprogress" };
        return map[task.status] || "";
      };

      gantt.init(ganttRef.current);

      // Daten laden
      const tasks = project.tasks.map(t => ({
        id:         t.id,
        text:       t.name,
        start_date: t.start_date || new Date().toISOString().split("T")[0],
        end_date:   t.deadline   || new Date().toISOString().split("T")[0],
        progress:   (t.progress || 0) / 100,
        status:     t.status,
        parent:     0,
      }));

      const links = [];
      project.tasks.forEach(t => {
        (t.depends_on || []).forEach(depId => {
          links.push({ id: `${depId}-${t.id}`, source: depId, target: t.id, type: "0" });
        });
      });

      gantt.parse({ data: tasks, links });

      // Drag → Backend
      gantt.attachEvent("onAfterTaskDrag", (taskId) => {
        const t = gantt.getTask(taskId);
        patchTask.mutate({
          taskId,
          data: {
            start_date: t.start_date.toISOString().split("T")[0],
            deadline:   t.end_date.toISOString().split("T")[0],
          }
        });
      });

      gantt.attachEvent("onAfterLinkAdd", (id, link) => {
        const target = gantt.getTask(link.target);
        patchTask.mutate({
          taskId: link.target,
          data: { depends_on: [...(target.depends_on || []), link.source] }
        });
      });

      return () => gantt.clearAll();
    });
  }, [project]);

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
        <Link to={`/projects/${id}`} className="btn-ghost p-1.5">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="font-semibold">{project?.name} — Gantt</h1>
        <span className="text-xs text-gray-500 ml-1">
          Drag & Drop · Abhängigkeiten · Fortschritt
        </span>
      </div>

      {/* DHTMLX Gantt CSS */}
      <link rel="stylesheet" href="https://cdn.dhtmlx.com/gantt/edge/dhtmlxgantt.css" />

      <div ref={ganttRef} className="flex-1" style={{ background: "#111827" }} />
    </div>
  );
}
