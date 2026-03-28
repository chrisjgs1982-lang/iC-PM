import { format, isPast } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays, CheckSquare } from "lucide-react";
import { useState } from "react";
import TaskDetailModal from "./TaskDetailModal";

export default function TaskCard({ task, projectId }) {
  const [open, setOpen] = useState(false);
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done";

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-3 cursor-pointer transition-colors"
      >
        <div className="font-medium text-sm mb-1">{task.name}</div>
        {task.description && (
          <div className="text-xs text-gray-500 truncate mb-2">{task.description}</div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge-${task.priority}`}>
            {task.priority === "high" ? "Hoch" : task.priority === "medium" ? "Mittel" : "Niedrig"}
          </span>
          {task.deadline && (
            <span className={`flex items-center gap-0.5 text-xs ${isOverdue ? "text-red-400" : "text-gray-500"}`}>
              <CalendarDays size={10} />
              {format(new Date(task.deadline), "d. MMM", { locale: de })}
            </span>
          )}
          {checklist.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-gray-500">
              <CheckSquare size={10} />
              {checklist.filter(c=>c.done).length}/{checklist.length}
            </span>
          )}
        </div>
        {task.assignee && (
          <div className="mt-2 flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold">
              {task.assignee[0].toUpperCase()}
            </div>
            <span className="text-xs text-gray-500">{task.assignee}</span>
          </div>
        )}
        {task.progress > 0 && (
          <div className="mt-2 bg-gray-800 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${task.progress}%` }} />
          </div>
        )}
      </div>
      {open && <TaskDetailModal task={task} projectId={projectId} onClose={() => setOpen(false)} />}
    </>
  );
}
