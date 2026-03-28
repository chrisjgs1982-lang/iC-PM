import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { BarChart2, TrendingUp, Users, AlertTriangle } from "lucide-react";

export default function ReportsPage() {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api("/projects"),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Berichte</h1>

      <div className="grid grid-cols-1 gap-4">
        {projects.map(p => (
          <ProjectReportCard key={p.id} project={p} />
        ))}
        {projects.length === 0 && (
          <div className="card text-center text-gray-500 py-12">
            Noch keine Projekte vorhanden.
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectReportCard({ project }) {
  const { data: report } = useQuery({
    queryKey: ["report", project.id],
    queryFn: () => api(`/reports/project/${project.id}`),
  });

  const s = report?.summary;
  const progress = s ? Math.round((s.done / Math.max(s.total, 1)) * 100) : 0;

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
        <h2 className="font-semibold">{project.name}</h2>
        <span className="text-xs text-gray-500 ml-auto">{project.owner}</span>
      </div>

      {s && (
        <>
          {/* Fortschrittsbalken */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Gesamtfortschritt</span>
              <span>{progress}%</span>
            </div>
            <div className="bg-gray-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Statistiken */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Gesamt",     value: s.total,       color: "text-gray-300" },
              { label: "Erledigt",   value: s.done,        color: "text-green-400" },
              { label: "In Arbeit",  value: s.in_progress, color: "text-blue-400" },
              { label: "Überfällig", value: s.overdue,     color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>{value || 0}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Nach Person */}
          {report.by_assignee?.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Users size={12} /> Nach Person
              </h3>
              <div className="space-y-1.5">
                {report.by_assignee.map(a => (
                  <div key={a.assignee} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {a.assignee[0].toUpperCase()}
                    </div>
                    <span className="flex-1 text-gray-300">{a.assignee}</span>
                    <span className="text-gray-500 text-xs">{a.done}/{a.total}</span>
                    <div className="w-24 bg-gray-800 rounded-full h-1">
                      <div
                        className="bg-green-500 h-1 rounded-full"
                        style={{ width: `${Math.round((a.done/Math.max(a.total,1))*100)}%` }}
                      />
                    </div>
                    {Number(a.overdue) > 0 && (
                      <span className="text-xs text-red-400">{a.overdue} überfällig</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
