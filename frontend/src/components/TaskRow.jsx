import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { format, isPast } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronDown, ChevronRight, CheckSquare, Trash2 } from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";

const STATUS_OPTIONS = ["new","in_progress","done","overdue","blocked"];
const STATUS_LABEL   = { new:"Neu", in_progress:"In Arbeit", done:"Erledigt", overdue:"Überfällig", blocked:"Blockiert" };

export default function TaskRow({ task, isLast, projectId }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const patch = useMutation({
    mutationFn: data => api(`/tasks/${task.id}`, { method: "PATCH", body: data }),
    onSuccess: () => qc.invalidateQueries(["project", projectId]),
  });

  const del = useMutation({
    mutationFn: () => api(`/tasks/${task.id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries(["project", projectId]),
  });

  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const checkDone = checklist.filter(c => c.done).length;

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done";

  return (
    <>
      <tr
        className={`group border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer
          ${isLast ? "border-b-0" : ""}`}
        onClick={() => setOpen(true)}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isOverdue ? "text-red-400" : ""}`}>{task.name}</span>
            {checklist.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <CheckSquare size={10} />
                {checkDone}/{checklist.length}
              </span>
            )}
          </div>
          {task.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">{task.description}</div>
          )}
        </td>
        <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={e => patch.mutate({ status: e.target.value })}
            className={`badge-${task.status} border-none bg-transparent text-xs cursor-pointer`}
            onClick={e => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2.5">
          <span className={`badge-${task.priority}`}>
            {task.priority === "high" ? "Hoch" : task.priority === "medium" ? "Mittel" : "Niedrig"}
          </span>
        </td>
        <td className="px-3 py-2.5 text-sm text-gray-400">{task.assignee || "–"}</td>
        <td className="px-3 py-2.5 text-sm">
          {task.deadline ? (
            <span className={isOverdue ? "text-red-400 font-medium" : "text-gray-400"}>
              {format(new Date(task.deadline), "d. MMM", { locale: de })}
            </span>
          ) : "–"}
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{task.progress || 0}%</span>
          </div>
        </td>
        <td className="px-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => del.mutate()}
            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-gray-600 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </td>
      </tr>
      {open && <TaskDetailModal task={task} projectId={projectId} onClose={() => setOpen(false)} />}
    </>
  );
}
