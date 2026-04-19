import { useState, useEffect } from "react";
import {
  UserCheck, UserX, Clock, CheckCircle, XCircle, Search,
  ChevronDown, ChevronUp, Users, ClipboardList, FileText,
} from "lucide-react";
import { getAllTutorsAdmin, approveTutorProfile } from "../services/Module_01_API";
import { getPendingTutorSignups, approveUser } from "../services/UserAPI";

// ── Types ─────────────────────────────────────────────────────────────────────

type TutorSignup = {
  UserId: number;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  Status: string;
  CreatedAt: string;
};

type TutorProfile = {
  Id: string;
  UserId: number;
  Email: string;
  FullName: string;
  Bio: string;
  SubjectsTaught: string[];
  Qualifications: string[];
  Languages: string[];
  TeachingStyles: string[];
  HourlyRate: number;
  Status: string;
  IsVerified: boolean;
  CreatedAt: string;
  CertificateUrl?: string;
  IdDocumentUrl?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlstDateStr(utcStr: string) {
  if (!utcStr) return "";
  const d = new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z");
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Colombo",
  });
}

async function rejectTutorProfile(profileId: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `http://localhost:55708/api/tutorprofile/soft-delete/${profileId}?newStatus=Suspended`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  return res.json();
}

/**
 * Opens a base64 data-URI document in a new tab using a Blob URL.
 * Browsers block top-frame navigation to data: URLs, but allow blob: URLs.
 */
function openDocument(dataUri: string) {
  try {
    const [header, b64] = dataUri.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "application/octet-stream";
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    // Revoke after the tab has had time to load the blob
    if (win) win.addEventListener("load", () => URL.revokeObjectURL(url));
    else URL.revokeObjectURL(url);
  } catch {
    alert("Could not open document. The file data may be corrupted.");
  }
}

const PROFILE_STATUS_STYLES: Record<string, string> = {
  "Pending Verification": "bg-amber-100 text-amber-700",
  Active:                  "bg-emerald-100 text-emerald-700",
  Inactive:                "bg-slate-100 text-slate-600",
  Suspended:               "bg-rose-100 text-rose-700",
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Account Signups
// ══════════════════════════════════════════════════════════════════════════════

function AccountSignupsTab() {
  const [signups, setSignups]         = useState<TutorSignup[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError]     = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchSignups = async () => {
    setLoading(true);
    try {
      const res = await getPendingTutorSignups();
      if (res?.StatusCode === 1) setSignups(Array.isArray(res.Data) ? res.Data : []);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSignups(); }, []);

  const handleDecision = async (signup: TutorSignup, status: "Active" | "Suspended") => {
    setActionLoading(signup.UserId);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await approveUser({ userId: signup.UserId, status });
      if (res?.StatusCode === 1) {
        setSignups(prev => prev.filter(s => s.UserId !== signup.UserId));
        setActionSuccess(
          status === "Active"
            ? `${signup.FullName} account has been approved.`
            : `${signup.FullName} account has been rejected.`,
        );
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        setActionError(res?.Message || "Action failed. Please try again.");
      }
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = signups.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.FullName?.toLowerCase().includes(q) || s.Email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {actionSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <XCircle className="w-4 h-4 flex-shrink-0" /> {actionError}
        </div>
      )}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 w-full"
        />
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Loading pending signups...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">No pending tutor signups</p>
          <p className="text-slate-400 text-xs mt-1">All tutor account requests have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(signup => {
            const isActioning = actionLoading === signup.UserId;
            return (
              <div key={signup.UserId} className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                  {signup.FullName?.charAt(0)?.toUpperCase() ?? "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{signup.FullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{signup.Email}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    Signed up {toSlstDateStr(signup.CreatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDecision(signup, "Active")}
                    disabled={isActioning}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {isActioning ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleDecision(signup, "Suspended")}
                    disabled={isActioning}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-60"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    {isActioning ? "..." : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Profile Reviews
// ══════════════════════════════════════════════════════════════════════════════

function ProfileReviewsTab() {
  const [profiles, setProfiles]     = useState<TutorProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [subTab, setSubTab]         = useState<"pending" | "all">("pending");
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError]     = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await getAllTutorsAdmin();
      if (res?.StatusCode === 1) setProfiles(Array.isArray(res.Data) ? res.Data : []);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleApprove = async (profile: TutorProfile) => {
    setActionLoading(profile.Id);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await approveTutorProfile(profile.Id);
      if (res?.StatusCode === 1) {
        setProfiles(prev => prev.map(p => p.Id === profile.Id ? { ...p, Status: "Active", IsVerified: true } : p));
        setActionSuccess(`${profile.FullName} profile has been approved.`);
        setExpanded(null);
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        setActionError(res?.Message || "Approval failed. Please try again.");
      }
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Approval failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (profile: TutorProfile) => {
    setActionLoading(profile.Id);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await rejectTutorProfile(profile.Id);
      if (res?.StatusCode === 1) {
        setProfiles(prev => prev.map(p => p.Id === profile.Id ? { ...p, Status: "Suspended" } : p));
        setActionSuccess(`${profile.FullName} profile has been rejected.`);
        setExpanded(null);
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        setActionError(res?.Message || "Rejection failed. Please try again.");
      }
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Rejection failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = profiles.filter(p => p.Status === "Pending Verification").length;

  const filtered = (
    subTab === "pending" ? profiles.filter(p => p.Status === "Pending Verification") : profiles
  ).filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.FullName?.toLowerCase().includes(q) ||
      p.Email?.toLowerCase().includes(q) ||
      p.SubjectsTaught?.some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {actionSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <XCircle className="w-4 h-4 flex-shrink-0" /> {actionError}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["pending", "all"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === tab ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab === "pending" ? `Pending (${pendingCount})` : `All (${profiles.length})`}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, subject..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 w-64"
          />
        </div>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">Loading tutor profiles...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <UserCheck className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">{subTab === "pending" ? "No pending profile reviews." : "No tutor profiles found."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(profile => {
            const isExpanded  = expanded === profile.Id;
            const isActioning = actionLoading === profile.Id;
            const isPending   = profile.Status === "Pending Verification";
            return (
              <div key={profile.Id} className={`bg-white rounded-2xl border shadow-sm transition-all ${isPending ? "border-amber-200" : "border-slate-200"}`}>
                <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : profile.Id)}>
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm flex-shrink-0">
                    {profile.FullName?.charAt(0)?.toUpperCase() ?? "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm">{profile.FullName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROFILE_STATUS_STYLES[profile.Status] ?? "bg-slate-100 text-slate-600"}`}>{profile.Status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{profile.Email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
                    <span>LKR {profile.HourlyRate?.toLocaleString()}/hr</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{toSlstDateStr(profile.CreatedAt)}</span>
                  </div>
                  {isPending && (
                    <div className="flex items-center gap-2 ml-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleApprove(profile)} disabled={isActioning} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                        <UserCheck className="w-3.5 h-3.5" />{isActioning ? "..." : "Approve"}
                      </button>
                      <button onClick={() => handleReject(profile)} disabled={isActioning} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-60">
                        <UserX className="w-3.5 h-3.5" />{isActioning ? "..." : "Reject"}
                      </button>
                    </div>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Subjects</p>
                        <div className="flex flex-wrap gap-1">
                          {(profile.SubjectsTaught ?? []).length > 0
                            ? profile.SubjectsTaught.map(s => <span key={s} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-lg text-xs">{s}</span>)
                            : <span className="text-slate-400 text-xs">None listed</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Qualifications</p>
                        <div className="flex flex-wrap gap-1">
                          {(profile.Qualifications ?? []).length > 0
                            ? profile.Qualifications.map((q, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs">{q}</span>)
                            : <span className="text-slate-400 text-xs">None listed</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Languages</p>
                        <div className="flex flex-wrap gap-1">
                          {(profile.Languages ?? []).length > 0
                            ? profile.Languages.map(l => <span key={l} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs">{l}</span>)
                            : <span className="text-slate-400 text-xs">Not specified</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Teaching Styles</p>
                        <div className="flex flex-wrap gap-1">
                          {(profile.TeachingStyles ?? []).length > 0
                            ? profile.TeachingStyles.map(t => <span key={t} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs">{t}</span>)
                            : <span className="text-slate-400 text-xs">Not specified</span>}
                        </div>
                      </div>
                    </div>
                    {profile.Bio && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Bio</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{profile.Bio}</p>
                      </div>
                    )}
                    {(profile.CertificateUrl || profile.IdDocumentUrl) && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Submitted Documents</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.CertificateUrl && (
                            <button
                              onClick={() => openDocument(profile.CertificateUrl!)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Certificate
                            </button>
                          )}
                          {profile.IdDocumentUrl && (
                            <button
                              onClick={() => openDocument(profile.IdDocumentUrl!)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" /> View ID Document
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>User ID: {profile.UserId}</span>
                      <span className="text-slate-300">|</span>
                      <span>Registered: {toSlstDateStr(profile.CreatedAt)}</span>
                      <span className="text-slate-300">|</span>
                      <span>Rate: LKR {profile.HourlyRate?.toLocaleString()}/hr</span>
                    </div>
                    {isPending && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleApprove(profile)} disabled={isActioning} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                          <UserCheck className="w-4 h-4" />{isActioning ? "Processing..." : "Approve Profile"}
                        </button>
                        <button onClick={() => handleReject(profile)} disabled={isActioning} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-60">
                          <UserX className="w-4 h-4" />{isActioning ? "Processing..." : "Reject Profile"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

type MainTab = "signups" | "profiles";

export default function TutorApproval() {
  const [mainTab, setMainTab] = useState<MainTab>("signups");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-violet-600" />
          Tutor Approval
        </h1>
        <p className="text-slate-500 mt-1">Manage new tutor signups and submitted profile reviews</p>
      </div>
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-6 w-fit">
        <button
          onClick={() => setMainTab("signups")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === "signups" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Users className="w-4 h-4" />
          Account Signups
        </button>
        <button
          onClick={() => setMainTab("profiles")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === "profiles" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <ClipboardList className="w-4 h-4" />
          Profile Reviews
        </button>
      </div>
      {mainTab === "signups" ? <AccountSignupsTab /> : <ProfileReviewsTab />}
    </div>
  );
}
