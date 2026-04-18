import { useState, useEffect } from "react";
import {
  BarChart3, Users, MessageSquare, FileText, Download,
  Loader2, Calendar, Filter, TrendingUp, BookOpen,
  FileUp, ClipboardList, RefreshCw, ArrowDownToLine
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  getAdminStudentsReport, getAdminTutorsReport,
  getAdminInSessionReport, getAdminOutSessionReport,
  getAdminResourcesReport, getAdminSessionNotesReport,
  downloadStudentsReportPdf, downloadTutorsReportPdf,
  downloadSessionNotesPdf
} from "../services/Module_03_API";
import { getAllUsers } from "../services/UserAPI";

interface SummaryStats {
  totalUsers: number;
  totalStudents: number;
  totalTutors: number;
  activeUsers: number;
  totalInSessionMessages: number;
  totalOutSessionMessages: number;
  totalFiles: number;
  totalSessionNotes: number;
}

type ReportTab = "overview" | "users" | "messages" | "files" | "notes";

export default function AdminReports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [stats, setStats] = useState<SummaryStats>({
    totalUsers: 0, totalStudents: 0, totalTutors: 0, activeUsers: 0,
    totalInSessionMessages: 0, totalOutSessionMessages: 0,
    totalFiles: 0, totalSessionNotes: 0,
  });
  const [downloading, setDownloading] = useState<string | null>(null);

  // Detailed data
  const [usersList, setUsersList] = useState<any[]>([]);
  const [inMessages, setInMessages] = useState<any[]>([]);
  const [outMessages, setOutMessages] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, studentsRes, tutorsRes, inRes, outRes, filesRes, notesRes] = await Promise.allSettled([
        getAllUsers(),
        getAdminStudentsReport(),
        getAdminTutorsReport(),
        getAdminInSessionReport(),
        getAdminOutSessionReport(),
        getAdminResourcesReport(),
        getAdminSessionNotesReport(),
      ]);

      const extractData = (res: PromiseSettledResult<any>) => {
        if (res.status !== "fulfilled") return [];
        const d = res.value?.Data ?? res.value?.data ?? res.value;
        return Array.isArray(d) ? d : [];
      };

      const allUsers = extractData(usersRes);
      const students = extractData(studentsRes);
      const tutors = extractData(tutorsRes);
      const inMsgs = extractData(inRes);
      const outMsgs = extractData(outRes);
      const filesList = extractData(filesRes);
      const notesList = extractData(notesRes);

      setUsersList(allUsers);
      setInMessages(inMsgs);
      setOutMessages(outMsgs);
      setFiles(filesList);
      setNotes(notesList);

      setStats({
        totalUsers: allUsers.length || (students.length + tutors.length),
        totalStudents: students.length || allUsers.filter((u: any) => u.RoleName === "Student").length,
        totalTutors: tutors.length || allUsers.filter((u: any) => u.RoleName === "Tutor").length,
        activeUsers: allUsers.filter((u: any) => u.Status === "Active").length,
        totalInSessionMessages: inMsgs.length,
        totalOutSessionMessages: outMsgs.length,
        totalFiles: filesList.length,
        totalSessionNotes: notesList.length,
      });
    } catch (e: any) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (type: "students" | "tutors" | "notes") => {
    setDownloading(type);
    try {
      let blob: Blob;
      let filename: string;
      if (type === "students") {
        blob = await downloadStudentsReportPdf();
        filename = `Students_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      } else if (type === "tutors") {
        blob = await downloadTutorsReportPdf();
        filename = `Tutors_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      } else {
        blob = await downloadSessionNotesPdf();
        filename = `SessionNotes_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded!`);
    } catch (e: any) {
      toast.error("Download failed: " + (e.message || "Unknown error"));
    } finally {
      setDownloading(null);
    }
  };

  const handleExportCsv = (data: any[], filename: string) => {
    if (!data.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          const str = val == null ? "" : String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const tabs: { key: ReportTab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "users", label: "Users", icon: Users },
    { key: "messages", label: "Messages", icon: MessageSquare },
    { key: "files", label: "Files", icon: FileUp },
    { key: "notes", label: "Session Notes", icon: ClipboardList },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-600" />
            Reports & Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Module 3 — Communication & Collaboration Reports
          </p>
        </div>
        <button onClick={loadAllData} disabled={loading}
          className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === t.key
                  ? "bg-white dark:bg-slate-900 text-violet-600 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "violet", sub: `${stats.activeUsers} active` },
              { label: "Students", value: stats.totalStudents, icon: BookOpen, color: "blue", sub: "registered" },
              { label: "Tutors", value: stats.totalTutors, icon: Users, color: "emerald", sub: "registered" },
              { label: "Total Messages", value: stats.totalInSessionMessages + stats.totalOutSessionMessages, icon: MessageSquare, color: "amber", sub: `${stats.totalInSessionMessages} in-session` },
              { label: "In-Session Msgs", value: stats.totalInSessionMessages, icon: MessageSquare, color: "blue", sub: "during sessions" },
              { label: "Out-Session Msgs", value: stats.totalOutSessionMessages, icon: MessageSquare, color: "indigo", sub: "outside sessions" },
              { label: "Files Uploaded", value: stats.totalFiles, icon: FileUp, color: "emerald", sub: "resource files" },
              { label: "Session Notes", value: stats.totalSessionNotes, icon: ClipboardList, color: "rose", sub: "submitted" },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl bg-${c.color}-50 dark:bg-${c.color}-900/20 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${c.color}-600 dark:text-${c.color}-400`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Quick Export */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-violet-600" />
              Quick Export
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {["students", "tutors", "notes"].map(type => (
                <button key={type} onClick={() => handleDownloadPdf(type as any)}
                  disabled={downloading === type}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 transition-all disabled:opacity-50">
                  {downloading === type ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)} Report (PDF)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Users Tab ─── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              All Users ({usersList.length})
            </h3>
            <div className="flex gap-2">
              <button onClick={() => handleExportCsv(usersList, "Users")}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => handleDownloadPdf("students")} disabled={downloading === "students"}
                className="px-3 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-lg text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors flex items-center gap-1 disabled:opacity-50">
                {downloading === "students" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />} PDF
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {usersList.map((u: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{u.FullName || u.fullName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.Email || u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400">
                          {u.RoleName || u.roleName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          (u.Status || u.status) === "Active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        }`}>
                          {u.Status || u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {(u.CreatedAt || u.createdAt) ? new Date(u.CreatedAt || u.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Messages Tab ─── */}
      {activeTab === "messages" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* In-Session Messages */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  In-Session Messages ({inMessages.length})
                </h3>
                <button onClick={() => handleExportCsv(inMessages, "InSessionMessages")}
                  className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {inMessages.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No in-session messages found</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900">
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400">Booking</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400">Sender</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400">Message</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {inMessages.slice(0, 50).map((m: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{m.BookingId || m.bookingId}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{m.SenderName || m.senderName || m.SenderId || m.senderId}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{m.MessageText || m.messageText}</td>
                          <td className="px-3 py-2 text-slate-500">{(m.CreatedAt || m.createdAt) ? new Date(m.CreatedAt || m.createdAt).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Out-Session Messages */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Out-Session Messages ({outMessages.length})
                </h3>
                <button onClick={() => handleExportCsv(outMessages, "OutSessionMessages")}
                  className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {outMessages.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No out-session messages found</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900">
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400">Booking</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400">Sender</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400">Message</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {outMessages.slice(0, 50).map((m: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{m.BookingId || m.bookingId}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{m.SenderName || m.senderName || m.SenderId || m.senderId}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{m.MessageText || m.messageText}</td>
                          <td className="px-3 py-2 text-slate-500">{(m.CreatedAt || m.createdAt) ? new Date(m.CreatedAt || m.createdAt).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Files Tab ─── */}
      {activeTab === "files" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              File Resources ({files.length})
            </h3>
            <button onClick={() => handleExportCsv(files, "FileResources")}
              className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              {files.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No files found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">File Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Size</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Booking</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Uploader</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {files.map((f: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium max-w-[200px] truncate">
                          {f.FileName || f.fileName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                            {f.FileType || f.fileType || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                          {f.FileSize || f.fileSize ? `${((f.FileSize || f.fileSize) / 1024 / 1024).toFixed(2)} MB` : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{f.BookingId || f.bookingId}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{f.UploaderName || f.uploaderName || f.UploadedBy || f.uploadedBy}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {(f.CreatedAt || f.createdAt) ? new Date(f.CreatedAt || f.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Session Notes Tab ─── */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Session Notes ({notes.length})
            </h3>
            <div className="flex gap-2">
              <button onClick={() => handleExportCsv(notes, "SessionNotes")}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => handleDownloadPdf("notes")} disabled={downloading === "notes"}
                className="px-3 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors flex items-center gap-1 disabled:opacity-50">
                {downloading === "notes" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />} PDF
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No session notes found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Booking</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Tutor</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Topics Covered</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Homework</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {notes.map((n: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{n.BookingId || n.bookingId}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{n.TutorName || n.tutorName || n.TutorId || n.tutorId}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[250px] truncate">{n.TopicsCovered || n.topicsCovered}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{n.Homework || n.homework || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {(n.CreatedAt || n.createdAt) ? new Date(n.CreatedAt || n.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
