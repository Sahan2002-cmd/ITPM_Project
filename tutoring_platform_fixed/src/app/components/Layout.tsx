import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router";
import {
  BookOpen, Calendar, MessageSquare, Upload, FileText, Library,
  LayoutDashboard, Video, Shield, Menu, X,
  GraduationCap, Bell, Search, Settings, LogOut,
  BarChart3, Clock, Play, Sun, Moon, ChevronRight, Users
} from "lucide-react";
import { TUTOR_IMAGES } from "../data/mockData";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { motion, AnimatePresence } from "motion/react";

// ── Role-specific nav configs ─────────────────────────────────────────────────
const NAV_CONFIG = {
  student: {
    accent: "violet",
    accentBg: "bg-violet-50 dark:bg-violet-900/30",
    accentText: "text-violet-700 dark:text-violet-300",
    accentIcon: "text-violet-600 dark:text-violet-400",
    accentChevron: "text-violet-400 dark:text-violet-500",
    badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    label: "Student Portal",
    gradient: "from-violet-600 to-indigo-600",
    sections: [
      {
        label: "My Learning",
        items: [
          { to: "/student/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
          { to: "/student/browse",     icon: Search,          label: "Browse Tutors" },
          { to: "/student/history",    icon: Clock,           label: "Booking History" },
          { to: "/student/meetings",   icon: Calendar,        label: "Meetings" },
          { to: "/student/recordings", icon: Play,            label: "Recordings" },
          { to: "/student/chat",       icon: MessageSquare,   label: "Messages" },
          { to: "/student/materials",  icon: Library,         label: "Materials Library" },
          { to: "/student/session/notes", icon: FileText,     label: "Session Notes" },
        ],
      },
    ],
  },
  tutor: {
    accent: "emerald",
    accentBg: "bg-emerald-50 dark:bg-emerald-900/30",
    accentText: "text-emerald-700 dark:text-emerald-300",
    accentIcon: "text-emerald-600 dark:text-emerald-400",
    accentChevron: "text-emerald-400 dark:text-emerald-500",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    label: "Tutor Portal",
    gradient: "from-emerald-600 to-teal-600",
    sections: [
      {
        label: "My Teaching",
        items: [
          { to: "/tutor/dashboard",         icon: BarChart3,       label: "Dashboard" },
          { to: "/tutor/availability",      icon: Calendar,        label: "Availability" },
          { to: "/tutor/chat",              icon: MessageSquare,   label: "Messages" },
          { to: "/tutor/meetings",          icon: Clock,           label: "Arrange Meetings" },
          { to: "/tutor/session/notes",     icon: FileText,        label: "Session Notes" },
          { to: "/tutor/recording/upload",  icon: Video,           label: "Upload Recording" },
          { to: "/tutor/files/upload",      icon: Upload,          label: "File Upload" },
        ],
      },
      {
        label: "My Profile",
        items: [
          { to: "/tutor/register",  icon: GraduationCap, label: "Registration" },
          { to: "/tutor/subjects",  icon: BookOpen,      label: "Subjects & Expertise" },
        ],
      },
    ],
  },
  admin: {
    accent: "rose",
    accentBg: "bg-rose-50 dark:bg-rose-900/30",
    accentText: "text-rose-700 dark:text-rose-300",
    accentIcon: "text-rose-600 dark:text-rose-400",
    accentChevron: "text-rose-400 dark:text-rose-500",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    label: "Admin Panel",
    gradient: "from-rose-600 to-pink-600",
    sections: [
      {
        label: "Administration",
        items: [
          { to: "/admin/analytics",  icon: BarChart3, label: "Analytics Panel" },
          { to: "/admin/moderation", icon: Shield,    label: "Moderation" },
          { to: "/admin/users",      icon: Users,     label: "User Management" },
          { to: "/admin/reports",    icon: FileText,  label: "Reports" },
        ],
      },
    ],
  },
};

const ROLE_LABELS = {
  student: "Student",
  tutor: "Tutor",
  admin: "Administrator",
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const role = user?.role ?? "student";
  const config = NAV_CONFIG[role];

  const isActive = (to: string) => location.pathname === to;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const profilePath = `/${role}/profile`;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} flex-shrink-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-10`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">PeerLearn</p>
              <p className={`text-[10px] font-medium ${config.accentText}`}>{config.label}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <Menu className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          </button>
        </div>

        {/* Role Badge */}
        {sidebarOpen && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${config.badgeColor}`}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {config.sections.map((section) => (
            <div key={section.label}>
              {sidebarOpen && (
                <p className={`px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider ${config.accentText} opacity-70`}>
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={!sidebarOpen ? item.label : undefined}
                        className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-150 group ${
                          active
                            ? `${config.accentBg} ${config.accentText} font-medium`
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? config.accentIcon : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
                        {sidebarOpen && <span className="truncate">{item.label}</span>}
                        {sidebarOpen && active && <ChevronRight className={`w-3 h-3 ml-auto ${config.accentChevron}`} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className={`border-t border-slate-100 dark:border-slate-800 p-3 ${sidebarOpen ? "" : "flex justify-center"}`}>
          <div
            onClick={() => navigate(profilePath)}
            className={`flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group relative ${sidebarOpen ? "" : "justify-center"}`}
            title={!sidebarOpen ? "View Profile" : undefined}
          >
            <div className="relative">
              <img
                src={user?.avatar || TUTOR_IMAGES.student}
                alt="User"
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-violet-400 dark:group-hover:ring-violet-500 transition-all"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></div>
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-slate-800 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {user?.name || "Guest User"}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate capitalize">{ROLE_LABELS[role]}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center gap-4 flex-shrink-0 transition-colors duration-300">
          <div className="flex-1">
            {role !== "admin" && (
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder={role === "tutor" ? "Search sessions, students..." : "Search tutors, subjects..."}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            )}
            {role === "admin" && (
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Admin Control Panel
              </span>
            )}
          </div>

          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {theme === "light" ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun className="w-4 h-4 text-amber-500" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="w-4 h-4 text-indigo-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Logout button in topbar */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
