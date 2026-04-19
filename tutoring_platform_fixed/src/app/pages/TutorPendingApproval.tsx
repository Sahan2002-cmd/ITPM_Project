import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router";
import { Clock, LogOut, RefreshCw, GraduationCap, Mail } from "lucide-react";
import { useState } from "react";

function toSlstDateStr(utcStr: string | null | undefined): string {
  if (!utcStr) return "";
  const d = new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Asia/Colombo",
  });
}

export default function TutorPendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Small delay to show spinner, then reload page so AuthContext re-reads localStorage
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Top strip */}
          <div className="h-2 bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-600" />

          <div className="p-8 sm:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-amber-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-violet-600" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
              Awaiting Admin Approval
            </h1>
            <p className="text-slate-500 text-center text-sm leading-relaxed mb-6">
              Your tutor account has been submitted successfully. An administrator will review
              your signup and notify you once a decision has been made.
            </p>

            {/* Info boxes */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Registered email</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{user?.email}</p>
                </div>
              </div>

              {user?.email && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-600">Status</p>
                    <p className="text-sm font-semibold text-amber-700 mt-0.5">Pending Admin Approval</p>
                    <p className="text-xs text-amber-600 mt-1">
                      You will receive an in-app notification once your account is reviewed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* What happens next */}
            <div className="bg-violet-50 rounded-2xl p-4 mb-8">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-3">
                What happens next?
              </p>
              <ol className="space-y-2">
                {[
                  "Admin reviews your account details",
                  "You are notified in-app of the decision",
                  "If approved, sign in to complete your tutor profile (7-day window)",
                  "Once your profile is complete, students can find and book you",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-200 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-violet-800">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Checking..." : "Check Status"}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Questions? Contact{" "}
          <a href="mailto:support@pltplatform.lk" className="text-violet-600 hover:underline">
            support@pltplatform.lk
          </a>
        </p>
      </div>
    </div>
  );
}
