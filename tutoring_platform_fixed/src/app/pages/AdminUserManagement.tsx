import { useState, useEffect } from "react";
import {
  Users, Search, Filter, Shield, GraduationCap, BookOpen,
  ChevronDown, Loader2, AlertCircle, CheckCircle2, XCircle,
  Clock, UserCheck, UserX, MoreVertical, Mail, Phone
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { getAllUsers, approveUser } from "../services/UserAPI";

interface UserRecord {
  UserId: number;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  RoleId: number;
  RoleName: string;
  Status: string;
  IsEmailVerified: boolean;
  ProfileImage: string;
  CreatedAt: string;
  Center: string;
  Semester: string;
}

type StatusFilter = "all" | "Active" | "Suspended" | "Pending" | "Inactive";
type RoleFilter = "all" | "Student" | "Tutor" | "Admin";

export default function AdminUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      const list = res?.Data ?? res?.data ?? res;
      if (Array.isArray(list)) {
        setUsers(list);
      } else if (list && typeof list === "object" && list.StatusCode === 1) {
        setUsers(list.Data || []);
      }
    } catch (e: any) {
      toast.error("Failed to load users: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: string) => {
    setUpdatingId(userId);
    setOpenMenuId(null);
    try {
      await approveUser({ userId, status: newStatus });
      setUsers(prev =>
        prev.map(u => (u.UserId === userId ? { ...u, Status: newStatus } : u))
      );
      toast.success(`User status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error("Failed to update status: " + (e.message || "Unknown error"));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      !search ||
      u.FullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.Email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.Status === statusFilter;
    const matchesRole = roleFilter === "all" || u.RoleName === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.Status === "Active").length,
    suspended: users.filter(u => u.Status === "Suspended").length,
    pending: users.filter(u => u.Status === "Pending").length,
    students: users.filter(u => u.RoleName === "Student").length,
    tutors: users.filter(u => u.RoleName === "Tutor").length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: any }> = {
      Active: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
      Suspended: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-400", icon: XCircle },
      Pending: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", icon: Clock },
      Inactive: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", icon: UserX },
    };
    const s = map[status] || map.Inactive;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { bg: string; text: string; icon: any }> = {
      Student: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-400", icon: GraduationCap },
      Tutor: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", icon: BookOpen },
      Admin: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-400", icon: Shield },
    };
    const r = map[role] || map.Student;
    const Icon = r.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${r.bg} ${r.text}`}>
        <Icon className="w-3 h-3" />
        {role}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" />
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage all registered users on the platform
          </p>
        </div>
        <button onClick={loadUsers} disabled={loading}
          className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Users", value: stats.total, color: "text-slate-700 dark:text-slate-200", bg: "bg-white dark:bg-slate-800" },
          { label: "Active", value: stats.active, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Suspended", value: stats.suspended, color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
          { label: "Pending", value: stats.pending, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Students", value: stats.students, color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
          { label: "Tutors", value: stats.tutors, color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-5 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as RoleFilter)}
          className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          <option value="all">All Roles</option>
          <option value="Student">Student</option>
          <option value="Tutor">Tutor</option>
          <option value="Admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20">
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Users className="w-12 h-12 opacity-30" />
          <p className="text-sm">No users found matching your filters</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Registered</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.map(u => (
                  <tr key={u.UserId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {u.FullName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{u.FullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">ID: {u.UserId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {u.Email}
                        </p>
                        {u.PhoneNumber && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {u.PhoneNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{roleBadge(u.RoleName)}</td>
                    <td className="px-4 py-3">{statusBadge(u.Status)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {u.CreatedAt ? new Date(u.CreatedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center relative">
                        {updatingId === u.UserId ? (
                          <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === u.UserId ? null : u.UserId)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </button>
                            {openMenuId === u.UserId && (
                              <div className="absolute right-0 top-8 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-[140px]">
                                {u.Status !== "Active" && (
                                  <button onClick={() => handleStatusChange(u.UserId, "Active")}
                                    className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2">
                                    <UserCheck className="w-3.5 h-3.5" /> Activate
                                  </button>
                                )}
                                {u.Status !== "Suspended" && (
                                  <button onClick={() => handleStatusChange(u.UserId, "Suspended")}
                                    className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2">
                                    <XCircle className="w-3.5 h-3.5" /> Suspend
                                  </button>
                                )}
                                {u.Status !== "Inactive" && (
                                  <button onClick={() => handleStatusChange(u.UserId, "Inactive")}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <UserX className="w-3.5 h-3.5" /> Deactivate
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      )}
    </div>
  );
}
