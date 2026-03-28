import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import GanttView from "./pages/GanttView";
import KanbanView from "./pages/KanbanView";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"         element={<Dashboard />} />
        <Route path="projects/:id"      element={<ProjectDetail />} />
        <Route path="projects/:id/gantt"  element={<GanttView />} />
        <Route path="projects/:id/kanban" element={<KanbanView />} />
        <Route path="reports"           element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
