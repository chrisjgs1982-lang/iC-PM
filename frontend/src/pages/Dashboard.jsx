import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, AlertTriangle, CheckCircle2, Clock, ChevronRight, BarChart2, Gantt } from "lucide-react";
import { api } from "../lib/api";
import { format, isPast } from "date-fns";
import { de } from "date-fns/locale";

const STATUS_LABEL = { new: "Neu", in_progress: "In Arbeit", done: "Erledigt", overdue: "Überfällig", blocked: "Blockiert" };
const PRIORITY_COLOR = { high: "badge-high", medium: "badge-medium", low: "badge-low" };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api("/projects"),
  });

  const stats = {
    total: projects.length,
    open: projects.reduce((s, p) => s + Number(p.open_tasks || 0), 0),
    overdue: projects.reduce((s, p) => s + Number(p.overdue_tasks || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={BarChart2}     label="Aktive Projekte"   value={stats.total}   color="bg-blue-900/40 text-blue-400" />
        <StatCard icon={Clock}         label="Offene Aufgaben"   value={stats.open}    color="bg-yellow-900/40 text-yellow-400" />
        <StatCard icon={AlertTriangle} label="Überfällig"        value={stats.overdue} color="bg-red-900/40 text-red-400" />
      </div>

      {/* Projekte */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Projekte</h2>
        {isLoading ? (
          <div className="text-gray-500 text-sm">Lade...</div>
        ) : projects.length === 0 ? (
          <div className="card text-center text-gray-500 py-12">
            Noch keine Projekte — klicke auf "Neues Projekt"
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="card hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{p.name}</span>
                      {Number(p.overdue_tasks) > 0 && (
                        <span className="badge-overdue">{p.overdue_tasks} überfällig</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                      {p.end_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} />
                          {format(new Date(p.end_date), "d. MMM yyyy", { locale: de })}
                        </span>
                      )}
                      <span>{p.open_tasks} offen</span>
                      {p.owner && <span>· {p.owner}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/projects/${p.id}`}      className="btn-ghost text-xs">Liste</Link>
                    <Link to={`/projects/${p.id}/gantt`}  className="btn-ghost text-xs">Gantt</Link>
                    <Link to={`/projects/${p.id}/kanban`} className="btn-ghost text-xs">Kanban</Link>
                    <ChevronRight size={14} className="text-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
