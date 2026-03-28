import * as XLSX from "xlsx";

export async function exportToExcel(project) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Aufgaben
  const taskData = (project.tasks || []).map(t => ({
    "Aufgabe":           t.name,
    "Beschreibung":      t.description || "",
    "Status":            t.status,
    "Priorität":         t.priority,
    "Verantwortlich":    t.assignee || "",
    "Start":             t.start_date || "",
    "Deadline":          t.deadline || "",
    "Fortschritt (%)":   t.progress || 0,
    "Checkliste (erledigt)": Array.isArray(t.checklist)
      ? `${t.checklist.filter(c=>c.done).length}/${t.checklist.length}`
      : "0/0",
  }));
  const ws1 = XLSX.utils.json_to_sheet(taskData);
  ws1["!cols"] = [
    {wch:30},{wch:40},{wch:12},{wch:10},{wch:20},{wch:12},{wch:12},{wch:16},{wch:20}
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Aufgaben");

  // Sheet 2: Projektinfo
  const info = [
    ["Projekt",    project.name],
    ["Beschreibung", project.description || ""],
    ["Status",     project.status],
    ["Projektleiter", project.owner || ""],
    ["Start",      project.start_date || ""],
    ["Ende",       project.end_date || ""],
    ["Export",     new Date().toLocaleString("de-DE")],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(info);
  ws2["!cols"] = [{wch:20},{wch:40}];
  XLSX.utils.book_append_sheet(wb, ws2, "Projektinfo");

  XLSX.writeFile(wb, `${project.name.replace(/\s+/g,"_")}_Export.xlsx`);
}
