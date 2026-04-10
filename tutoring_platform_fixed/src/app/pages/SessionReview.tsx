import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Star, Send, Check, ThumbsUp, MessageSquare, AlertCircle } from "lucide-react";
import { submitRating } from "../services/Module_04_API";
import { useAuth } from "../contexts/AuthContext";

type ReviewState = {
  bookingId: number | string;
  tutorProfileId: string;
  tutorId: number;
  tutorName: string;
  sessionDate: string;
  subject: string;
};

const criteria = [
  { key: "overall", label: "Overall Experience" },
  { key: "knowledge", label: "Subject Knowledge" },
  { key: "communication", label: "Communication" },
  { key: "patience", label: "Patience & Support" },
  { key: "materials", label: "Materials Provided" },
];

const suggestions = [
  "Excellent explanations", "Very patient", "Clear examples", "Great preparation",
  "Engaging teaching style", "Helpful homework", "Responsive to questions", "On time",
];

function toSlstDateStr(utcStr: string): string {
  if (!utcStr) return "";
  const d = new Date(utcStr.endsWith("Z") ? utcStr : utcStr + "Z");
  d.setMinutes(d.getMinutes() + 330);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SessionReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as ReviewState | null;

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hover, setHover] = useState<Record<string, number>>({});
  const [review, setReview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  // Redirect if accessed without booking context
  useEffect(() => {
    if (!state?.bookingId) {
      navigate("/student/history");
    }
  }, []);

  if (!state?.bookingId) {
    return null;
  }

  const setRating = (key: string, val: number) => setRatings(r => ({ ...r, [key]: val }));
  const toggleTag = (tag: string) => setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);
  const avgRating = Object.values(ratings).length
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1)
    : "—";

  const handleSubmit = async () => {
    if (!ratings.overall) {
      setError("Please rate the Overall Experience before submitting.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const feedbackParts: string[] = [];
      if (review.trim()) feedbackParts.push(review.trim());
      if (tags.length > 0) feedbackParts.push(`Tags: ${tags.join(", ")}`);
      if (wouldRecommend !== null) feedbackParts.push(wouldRecommend ? "Would recommend." : "Would not recommend.");

      const body = {
        BookingId: state.bookingId,
        TutorProfileId: state.tutorProfileId,
        TutorId: state.tutorId,
        StudentId: user?.userId,
        Stars: ratings.overall,
        Feedback: feedbackParts.join(" | ") || null,
      };

      const res = await submitRating(body);
      if (res?.StatusCode === 1) {
        setSubmitted(true);
        setTimeout(() => navigate("/student/history"), 2500);
      } else {
        setError(res?.Message || "Failed to submit review. Please try again.");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-80">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Review Submitted!</h2>
        <p className="text-slate-500 text-center">
          Thank you for your feedback on your session with {state.tutorName}. It will be visible after admin approval.
        </p>
        <div className="flex gap-1 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-6 h-6 ${i < Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Rate Your Session</h1>
        <p className="text-slate-500 mt-1">Share your experience to help the community</p>
      </div>

      {/* Tutor Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xl flex-shrink-0">
          {state.tutorName?.charAt(0)?.toUpperCase() ?? "T"}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{state.tutorName}</h3>
          <p className="text-sm text-slate-500">{state.subject}</p>
          <p className="text-xs text-slate-400 mt-0.5">{toSlstDateStr(state.sessionDate)}</p>
        </div>
        {Object.values(ratings).length > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{avgRating}</p>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Star Ratings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-800 mb-4">Rate Your Experience</h3>
        <div className="space-y-4">
          {criteria.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">
                {label}
                {key === "overall" && <span className="text-rose-500 ml-1">*</span>}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setHover(h => ({ ...h, [key]: i + 1 }))}
                    onMouseLeave={() => setHover(h => { const copy = { ...h }; delete copy[key]; return copy; })}
                    onClick={() => setRating(key, i + 1)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-6 h-6 transition-colors ${i < (hover[key] || ratings[key] || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-300"}`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-800 mb-3">Would you recommend {state.tutorName}?</h3>
        <div className="flex gap-3">
          {[{ val: true, label: "Yes, definitely!", color: "emerald" }, { val: false, label: "Not really", color: "rose" }].map(({ val, label, color }) => (
            <button key={label} onClick={() => setWouldRecommend(val)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all ${wouldRecommend === val ? color === "emerald" ? "bg-emerald-500 text-white border-emerald-500" : "bg-rose-500 text-white border-rose-500" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
              <ThumbsUp className={`w-4 h-4 ${val ? "" : "rotate-180"}`} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Tags */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-800 mb-3">What stood out? <span className="text-slate-400 font-normal text-sm">(optional)</span></h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button key={s} onClick={() => toggleTag(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${tags.includes(s) ? "bg-violet-600 text-white border-violet-600" : "border-slate-200 text-slate-600 hover:border-violet-300"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Written Review */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-violet-600" /> Written Review</h3>
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          placeholder="Share your experience in detail... What did you learn? How did the tutor help you?"
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-400">{review.length}/1000 characters</p>
          <p className="text-xs text-slate-400">Minimum 50 characters recommended</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!ratings.overall || submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200"
      >
        <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Review"}
      </button>
      <p className="text-xs text-center text-slate-400 mt-2">Your review will be visible after admin approval</p>
    </div>
  );
}
