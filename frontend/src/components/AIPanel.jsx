import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { X, Sparkles, AlertTriangle, Zap, Loader2 } from "lucide-react";

export default function AIPanel({ projectId, onClose }) {
  const qc = useQueryClient();
  const [tab, setTab]         = useState("generate");
  const [desc, setDesc]       = useState("");
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const generate = useMutation({
    mutationFn: () => api("/ai/generate-tasks", { method: "POST", body: { description: desc, project_id: projectId } }),
    onSuccess: d => setResult(d),
    onError: e => setError(e.message),
  });

  const risk = useMutation({
    mutationFn: () => api("/ai/risk-analysis", { method: "POST", body: { project_id: projectId } }),
    onSuccess: d => setResult(d),
    onError: e => setError(e.message),
  });

  const prioritize = useMutation({
    mutationFn: () => api("/ai/prioritize", { method: "POST", body: { project_id: projectId } }),
    onSuccess: d => setResult(d),
    onError: e => setError(e.message),
  });

  const isLoading = generate.isPending || risk.isPending || prioritize.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-purple-900/50 rounded-xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            <h2 className="font-semibold">KI-Assistent</h2>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-500" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {[
            { id: "generate",   label: "Aufgaben generieren", icon: Zap },
            { id: "risk",       label: "Risikoanalyse",       icon: AlertTriangle },
            { id: "prioritize", label: "Priorisierung",       icon: Sparkles },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id} onClick={() => { setTab(id); setResult(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors
                ${tab === id ? "text-purple-400 border-b-2 border-purple-500" : "text-gray-500 hover:text-gray-300"}`}
            >
              <Icon size={13}/> {label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === "generate" && (
            <>
              <p className="text-xs text-gray-500">Beschreibe dein Projekt und die KI erstellt einen strukturierten Aufgabenplan.</p>
              <textarea
                value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="z. B. 'Website-Relaunch für Q2: neues Design, SEO-Optimierung, Social Media Integration, Launch-Event'"
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
              <button
                onClick={() => generate.mutate()}
                disabled={!desc.trim() || isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Aufgaben generieren
              </button>
            </>
          )}

          {tab === "risk" && (
            <>
              <p className="text-xs text-gray-500">Analysiere Risiken, Engpässe und erhalte Handlungsempfehlungen basierend auf deinen aktuellen Aufgaben.</p>
              <button
                onClick={() => risk.mutate()}
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 bg-red-800 hover:bg-red-700"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                Risikoanalyse starten
              </button>
            </>
          )}

          {tab === "prioritize" && (
            <>
              <p className="text-xs text-gray-500">KI priorisiert deine offenen Aufgaben nach Dringlichkeit und strategischer Wichtigkeit.</p>
              <button
                onClick={() => prioritize.mutate()}
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                Aufgaben priorisieren
              </button>
            </>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
