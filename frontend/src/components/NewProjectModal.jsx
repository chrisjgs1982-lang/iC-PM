import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { X } from "lucide-react";

const COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4"];

export default function NewProjectModal({ onClose }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", color: "#3B82F6",
    owner: "", start_date: "", end_date: ""
  });

  const create = useMutation({
    mutationFn: data => api("/projects", { method: "POST", body: data }),
    onSuccess: (p) => {
      qc.invalidateQueries(["projects"]);
      onClose();
      navigate(`/projects/${p.id}`);
    },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-semibold">Neues Projekt</h2>
          <button onClick={onClose}><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="p-4 space-y-3">
          <input autoFocus value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="Projektname *"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Beschreibung" rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
          <input value={form.owner} onChange={e => set("owner", e.target.value)}
            placeholder="Projektleiter"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Startdatum</label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Enddatum</label>
              <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-2">Farbe</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c} onClick={() => set("color", c)}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110
                    ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
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
