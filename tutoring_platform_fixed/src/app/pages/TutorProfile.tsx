import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Clock, BookOpen, MessageSquare, BadgeCheck, Calendar, Award, Users, ThumbsUp, ChevronRight, Loader2, Star } from "lucide-react";
import { getTutorProfileById } from "../services/Module_01_API";
import { getRatingsByTutor } from "../services/Module_04_API";

interface TutorProfile {
  Id: string;
  UserId: number;
  FullName: string;
  Bio: string;
  SubjectsTaught: string[];
  Qualifications: string[];
  YearsOfExperience: number;
  HourlyRate: number;
  IsVerified: boolean;
  Status: string;
  Email: string;
  AverageRating?: number;
  TotalRatings?: number;
}

interface ApprovedRating {
  RatingId: number;
  StudentId: number;
  Stars: number;
  Feedback: string | null;
  CreatedAt: string;
}

function toSlstDateStr(utcStr: string) {
  if (!utcStr) return "";
  const d = new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z");
  d.setMinutes(d.getMinutes() + 330);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>();
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [ratings, setRatings] = useState<ApprovedRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getTutorProfileById(id),
      getRatingsByTutor(id),
    ])
      .then(([profileRes, ratingRes]: [any, any]) => {
        const profile = profileRes.Data ?? profileRes;
        if (!profile || !profile.Id) throw new Error("Tutor not found");
        setTutor(profile);
        if (ratingRes?.StatusCode === 1 && Array.isArray(ratingRes.Data)) {
          setRatings(ratingRes.Data);
        }
      })
      .catch((err: any) => setError(err.message || "Failed to load tutor"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-20 text-rose-600">
        {error ?? "Tutor not found"}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Hero */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-violet-500 to-indigo-600" />
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="w-20 h-20 rounded-2xl border-4 border-white bg-violet-100 flex items-center justify-center shadow-md text-3xl font-bold text-violet-700">
                  {tutor.FullName.charAt(0).toUpperCase()}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">{tutor.FullName}</h1>
                    {tutor.IsVerified && <BadgeCheck className="w-5 h-5 text-violet-500" />}
                  </div>
                  <p className="text-sm text-slate-500">{(tutor.SubjectsTaught ?? []).join(" • ")}</p>
                </div>
                <div className="ml-auto pb-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tutor.IsVerified ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {tutor.IsVerified ? "Verified Tutor" : "Tutor"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5 flex-wrap text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  {(tutor.SubjectsTaught ?? []).length} subjects
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-4 h-4 text-violet-500" />
                  {tutor.YearsOfExperience} yr{tutor.YearsOfExperience !== 1 ? "s" : ""} experience
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-4 h-4 text-violet-500" />
                  {tutor.Email}
                </div>
              </div>

              <p className="text-sm text-slate-600 mt-4 leading-relaxed">{tutor.Bio}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, label: "Years Experience", value: `${tutor.YearsOfExperience}+`, color: "text-violet-600", bg: "bg-violet-50" },
              { icon: Star, label: "Average Rating", value: tutor.AverageRating && tutor.AverageRating > 0 ? tutor.AverageRating.toFixed(1) : "New", color: "text-amber-600", bg: "bg-amber-50" },
              { icon: ThumbsUp, label: "Total Reviews", value: tutor.TotalRatings ? tutor.TotalRatings.toString() : "0", color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-violet-600" /> Subjects Offered</h2>
            <div className="flex gap-2 flex-wrap">
              {(tutor.SubjectsTaught ?? []).map(sub => (
                <span key={sub} className="px-3 py-2 bg-violet-50 border border-violet-100 text-violet-700 rounded-xl text-sm font-medium">{sub}</span>
              ))}
            </div>
          </div>

          {/* Qualifications */}
          {(tutor.Qualifications ?? []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-600" /> Qualifications
              </h2>
              <div className="space-y-2">
                {(tutor.Qualifications ?? []).map((q, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-4 h-4 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Student Reviews
              </h2>
              {tutor.AverageRating && tutor.AverageRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3.5 h-3.5 ${
                        n <= Math.round(tutor.AverageRating!) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{tutor.AverageRating!.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({tutor.TotalRatings} review{tutor.TotalRatings !== 1 ? "s" : ""})</span>
                </div>
              )}
            </div>

            {ratings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No approved reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {ratings.map(r => (
                  <div key={r.RatingId} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= r.Stars ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">{toSlstDateStr(r.CreatedAt)}</span>
                    </div>
                    {r.Feedback ? (
                      <p className="text-sm text-slate-600 leading-relaxed">{r.Feedback}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No written feedback.</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">— Student #{r.StudentId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-4">
            <div className="text-center mb-5">
              <p className="text-3xl font-bold text-violet-600">Rs. {tutor.HourlyRate.toLocaleString()}</p>
              <p className="text-sm text-slate-400">per hour</p>
            </div>

            <div className="space-y-2 mb-5">
              {["60 min session", "1-on-1 video call", "Session recordings", "Chat support", "Shared materials"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>

            <Link to={`/student/booking/${tutor.Id}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-700 transition-colors shadow-md shadow-violet-200">
              Book a Session <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/chat" className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">
              <MessageSquare className="w-4 h-4 text-violet-500" /> Send Message
            </Link>
            <p className="text-xs text-center text-slate-400 mt-3">Free cancellation up to 2 hours before</p>
          </div>
        </div>
      </div>
    </div>
  );
}
