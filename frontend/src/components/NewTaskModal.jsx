import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { X } from "lucide-react";

export default function NewTaskModal({ projectId, defaultStatus = "new", onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", description: "", status: defaultStatus,
    priority: "medium", assignee: "", deadline: "", start_date: "", progress: 0
  });

  const create = useMutation({
    mutationFn: data => api("/tasks", { method: "POST", body: { ...data, project_id: projectId } }),
    onSuccess: () => { qc.invalidateQueries(["project", projectId]); onClose(); },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-semibold">Neue Aufgabe</h2>
          <button onClick={onClose}><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="p-4 space-y-3">
          <input
            autoFocus value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="Aufgabenname *"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Beschreibung"
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="new">Neu</option>
                <option value="in_progress">In Arbeit</option>
                <option value="done">Erledigt</option>
                <option value="blocked">Blockiert</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Priorität</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="high">Hoch</option>
                <option value="medium">Mittel</option>
                <option value="low">Niedrig</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start</label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <input
            value={form.assignee} onChange={e => set("assignee", e.target.value)}
            placeholder="Verantwortliche Person"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
          <button onClick={onClose} className="btn-ghost">Abbrechen</button>
          <button
            onClick={() => create.mutate(form)}
            disabled={!form.name.trim() || create.isPending}
            className="btn-primary"
          >
            {create.isPending ? "Erstelle..." : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
