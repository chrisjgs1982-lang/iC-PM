import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Plus, BarChart2, Columns3, Network, Sparkles, Download, ArrowLeft } from "lucide-react";
import { useState } from "react";
import TaskRow from "../components/TaskRow";
import NewTaskModal from "../components/NewTaskModal";
import AIPanel from "../components/AIPanel";
import { exportToExcel } from "../lib/export";

const GROUP_OPTIONS = [
  { value: "",         label: "Keine Gruppierung" },
  { value: "status",   label: "Nach Status" },
  { value: "priority", label: "Nach Priorität" },
  { value: "assignee", label: "Nach Person" },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [showNew, setShowNew]   = useState(false);
  const [showAI, setShowAI]     = useState(false);
  const [groupBy, setGroupBy]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api(`/projects/${id}`),
  });

  const { data: report } = useQuery({
    queryKey: ["report", id],
    queryFn: () => api(`/reports/project/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-gray-500">Lade...</div>;
  if (!project)  return <div className="p-6 text-red-400">Projekt nicht gefunden</div>;

  const tasks = (project.tasks || []).filter(t =>
    !filterStatus || t.status === filterStatus
  );

  // Gruppierung
  let grouped = {};
  if (groupBy) {
    tasks.forEach(t => {
      const key = t[groupBy] || "–";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });
  } else {
    grouped = { "": tasks };
  }

  const progress = report ? Math.round((report.summary.done / Math.max(report.summary.total, 1)) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/dashboard" className="btn-ghost p-1"><ArrowLeft size={15} /></Link>
          <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
          <h1 className="font-bold text-lg">{project.name}</h1>
        </div>
        <p className="text-gray-500 text-sm ml-10">{project.description}</p>

        {/* Fortschrittsbalken */}
        <div className="ml-10 mt-2 flex items-center gap-3">
          <div className="flex-1 max-w-xs bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{progress}% erledigt</span>
          {report && (
            <span className="text-xs text-gray-500">
              {report.summary.done}/{report.summary.total} Aufgaben
              {Number(report.summary.overdue) > 0 && (
                <span className="text-red-400 ml-1">· {report.summary.overdue} überfällig</span>
              )}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-10 mt-3">
          <Link to={`/projects/${id}/gantt`}  className="btn-ghost text-xs flex items-center gap-1.5"><Network size={13}/> Gantt</Link>
          <Link to={`/projects/${id}/kanban`} className="btn-ghost text-xs flex items-center gap-1.5"><Columns3 size={13}/> Kanban</Link>
          <button onClick={() => setShowAI(true)} className="btn-ghost text-xs flex items-center gap-1.5 text-purple-400">
            <Sparkles size={13}/> KI-Assistent
          </button>
          <button
            onClick={() => exportToExcel(project)}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <Download size={13}/> Excel
          </button>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded text-xs px-2 py-1 text-gray-300"
            >
              <option value="">Alle Status</option>
              <option value="new">Neu</option>
              <option value="in_progress">In Arbeit</option>
              <option value="done">Erledigt</option>
              <option value="overdue">Überfällig</option>
            </select>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded text-xs px-2 py-1 text-gray-300"
            >
              {GROUP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setShowNew(true)} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus size={13}/> Aufgabe
            </button>
          </div>
        </div>
      </div>

      {/* Task-Liste */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {Object.entries(grouped).map(([group, gtasks]) => (
          <div key={group}>
            {group && (
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                {group}
                <span className="ml-2 normal-case font-normal text-gray-600">({gtasks.length})</span>
              </div>
            )}
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="text-left px-4 py-2 font-medium">Aufgabe</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium">Priorität</th>
                    <th className="text-left px-3 py-2 font-medium">Verantwortlich</th>
                    <th className="text-left px-3 py-2 font-medium">Deadline</th>
                    <th className="text-left px-3 py-2 font-medium w-28">Fortschritt</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {gtasks.map((t, i) => (
                    <TaskRow key={t.id} task={t} isLast={i === gtasks.length - 1} projectId={id} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            Keine Aufgaben — klicke auf "Aufgabe" um eine hinzuzufügen.
          </div>
        )}
      </div>

      {showNew && <NewTaskModal projectId={id} onClose={() => setShowNew(false)} />}
      {showAI  && <AIPanel projectId={id} onClose={() => setShowAI(false)} />}
    </div>
  );
}
