import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, BarChart3, Settings, Plus, Zap } from "lucide-react";
import { useState } from "react";
import NewProjectModal from "./NewProjectModal";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/reports",   icon: BarChart3,       label: "Berichte"  },
];

export default function Layout() {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-gray-800 gap-2">
          <Zap size={20} className="text-blue-400" />
          <span className="font-bold text-white tracking-tight">iC-PM</span>
        </div>

        <button
          onClick={() => setShowNew(true)}
          className="mx-3 mt-4 btn-primary flex items-center gap-2 justify-center"
        >
          <Plus size={16} /> Neues Projekt
        </button>

        <nav className="mt-4 flex-1 px-2 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                 ${isActive ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-gray-800"}`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">M</div>
            <span className="text-sm text-gray-300">Marketing Team</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gray-950">
        <Outlet />
      </main>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
