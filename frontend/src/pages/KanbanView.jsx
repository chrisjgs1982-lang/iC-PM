import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ArrowLeft, Plus, GripVertical } from "lucide-react";
import { useState } from "react";
import TaskCard from "../components/TaskCard";
import NewTaskModal from "../components/NewTaskModal";

const COLUMNS = [
  { id: "new",         label: "Neu",        color: "border-gray-600" },
  { id: "in_progress", label: "In Arbeit",  color: "border-blue-600" },
  { id: "blocked",     label: "Blockiert",  color: "border-yellow-600" },
  { id: "done",        label: "Erledigt",   color: "border-green-600" },
];

export default function KanbanView() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [newTaskStatus, setNewTaskStatus] = useState(null);

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api(`/projects/${id}`),
  });

  const patchTask = useMutation({
    mutationFn: ({ taskId, data }) => api(`/tasks/${taskId}`, { method: "PATCH", body: data }),
    onSuccess: () => qc.invalidateQueries(["project", id]),
  });

  const handleDrop = (e, targetStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) patchTask.mutate({ taskId, data: { status: targetStatus } });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
        <Link to={`/projects/${id}`} className="btn-ghost p-1.5">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="font-semibold">{project?.name} — Kanban</h1>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
          {COLUMNS.map(col => {
            const tasks = (project?.tasks || []).filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className="w-72 flex-shrink-0 flex flex-col"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, col.id)}
              >
                <div className={`flex items-center justify-between mb-2 pb-2 border-b-2 ${col.color}`}>
                  <span className="font-medium text-sm">{col.label}</span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto min-h-24">
                  {tasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={e => e.dataTransfer.setData("taskId", t.id)}
                    >
                      <TaskCard task={t} projectId={id} />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setNewTaskStatus(col.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 py-1.5 px-2 rounded hover:bg-gray-800 transition-colors"
                >
                  <Plus size={13} /> Aufgabe hinzufügen
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {newTaskStatus && (
        <NewTaskModal
          projectId={id}
          defaultStatus={newTaskStatus}
          onClose={() => setNewTaskStatus(null)}
        />
      )}
    </div>
  );
}
