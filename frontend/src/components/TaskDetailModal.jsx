import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { X, Plus, Check, Trash2, ChevronDown, ChevronRight } from "lucide-react";

function ChecklistItem({ item, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [newSub, setNewSub] = useState("");

  const addSub = () => {
    if (!newSub.trim()) return;
    const sub = { id: crypto.randomUUID(), text: newSub.trim(), done: false };
    onChange({ ...item, sub: [...(item.sub || []), sub] });
    setNewSub("");
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 group">
        <button onClick={() => onChange({ ...item, done: !item.done })}>
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
            ${item.done ? "bg-green-600 border-green-600" : "border-gray-600 hover:border-gray-400"}`}>
            {item.done && <Check size={10} />}
          </div>
        </button>
        <span className={`flex-1 text-sm ${item.done ? "line-through text-gray-500" : ""}`}>{item.text}</span>
        {(item.sub?.length > 0) && (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        )}
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400">
          <Trash2 size={12} />
        </button>
        <button onClick={() => setExpanded(!expanded)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-blue-400">
          <Plus size={12} />
        </button>
      </div>

      {expanded && (
        <div className="ml-6 space-y-1">
          {(item.sub || []).map((s, si) => (
            <div key={s.id} className="flex items-center gap-2 group">
              <button onClick={() => {
                const sub = [...item.sub];
                sub[si] = { ...s, done: !s.done };
                onChange({ ...item, sub });
              }}>
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center
                  ${s.done ? "bg-green-600 border-green-600" : "border-gray-600"}`}>
                  {s.done && <Check size={9} />}
                </div>
              </button>
              <span className={`text-xs flex-1 ${s.done ? "line-through text-gray-500" : "text-gray-300"}`}>{s.text}</span>
              <button onClick={() => {
                const sub = item.sub.filter((_, i) => i !== si);
                onChange({ ...item, sub });
              }} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <div className="flex gap-1 mt-1">
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSub()}
              placeholder="Unteraufgabe..."
              className="flex-1 bg-gray-800 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <button onClick={addSub} className="btn-ghost px-2 py-1 text-xs">+</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskDetailModal({ task, projectId, onClose }) {
  const qc = useQueryClient();
  const [checklist, setChecklist] = useState(
    Array.isArray(task.checklist) ? task.checklist : []
  );
  const [newItem, setNewItem] = useState("");
  const [progress, setProgress] = useState(task.progress || 0);
  const [dirty, setDirty] = useState(false);

  const patch = useMutation({
    mutationFn: data => api(`/tasks/${task.id}`, { method: "PATCH", body: data }),
    onSuccess: () => { qc.invalidateQueries(["project", projectId]); setDirty(false); },
  });

  const updateChecklist = (newList) => {
    setChecklist(newList);
    const done = newList.filter(i => i.done).length;
    const newProgress = newList.length > 0 ? Math.round((done / newList.length) * 100) : progress;
    setProgress(newProgress);
    setDirty(true);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    updateChecklist([...checklist, { id: crypto.randomUUID(), text: newItem.trim(), done: false, sub: [] }]);
    setNewItem("");
  };

  const save = () => patch.mutate({ checklist, progress });

  const doneCount = checklist.filter(i => i.done).length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="font-semibold">{task.name}</h2>
            {task.description && <p className="text-sm text-gray-400 mt-0.5">{task.description}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white ml-2"><X size={18} /></button>
        </div>

        {/* Meta */}
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          <span className={`badge-${task.status}`}>
            {task.status === "new" ? "Neu" : task.status === "in_progress" ? "In Arbeit" :
             task.status === "done" ? "Erledigt" : task.status === "overdue" ? "Überfällig" : "Blockiert"}
          </span>
          <span className={`badge-${task.priority}`}>
            {task.priority === "high" ? "Hoch" : task.priority === "medium" ? "Mittel" : "Niedrig"}
          </span>
          {task.assignee && <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{task.assignee}</span>}
          {task.deadline && <span className="text-xs text-gray-400">Deadline: {task.deadline}</span>}
        </div>

        {/* Fortschritt */}
        <div className="px-4 pt-3">
          <label className="text-xs text-gray-500 block mb-1">Fortschritt: {progress}%</label>
          <input
            type="range" min={0} max={100} value={progress}
            onChange={e => { setProgress(Number(e.target.value)); setDirty(true); }}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Checkliste */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400">
              Checkliste {checklist.length > 0 && `(${doneCount}/${checklist.length})`}
            </label>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {checklist.map((item, i) => (
              <ChecklistItem
                key={item.id}
                item={item}
                onChange={updated => {
                  const list = [...checklist];
                  list[i] = updated;
                  updateChecklist(list);
                }}
                onDelete={() => updateChecklist(checklist.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem()}
              placeholder="Neue Checklistenaufgabe..."
              className="flex-1 bg-gray-800 text-sm rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <button onClick={addItem} className="btn-ghost px-3 py-1.5 text-sm"><Plus size={14} /></button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
          <button onClick={onClose} className="btn-ghost">Schließen</button>
          {dirty && (
            <button onClick={save} disabled={patch.isPending} className="btn-primary">
              {patch.isPending ? "Speichern..." : "Speichern"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
