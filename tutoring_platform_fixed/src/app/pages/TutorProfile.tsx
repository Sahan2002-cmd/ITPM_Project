import { useParams, Link } from "react-router";
import { Star, Clock, BookOpen, MessageSquare, BadgeCheck, Calendar, Award, Users, ThumbsUp, ChevronRight } from "lucide-react";
import { tutors } from "../data/mockData";
import { TUTOR_IMAGES } from "../data/mockData";

const reviews = [
  { name: "Emma T.", avatar: TUTOR_IMAGES.student, rating: 5, date: "Feb 2026", text: "Sarah is an incredible tutor! She made calculus finally click for me. Her explanations are clear and she's very patient." },
  { name: "Marcus R.", avatar: TUTOR_IMAGES.alex, rating: 5, date: "Jan 2026", text: "Excellent session. Sarah helped me prepare for my exam and I got an A! Highly recommend." },
  { name: "Priya K.", avatar: TUTOR_IMAGES.mei, rating: 4, date: "Jan 2026", text: "Very knowledgeable and professional. The session was well-structured and informative." },
];

export default function TutorProfile() {
  const { id } = useParams();
  const tutor = tutors.find(t => t.id === id) || tutors[0];

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
                <img src={tutor.avatar} alt={tutor.name} className="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-md" />
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">{tutor.name}</h1>
                    <BadgeCheck className="w-5 h-5 text-violet-500" />
                  </div>
                  <p className="text-sm text-slate-500">{tutor.subjects.join(" • ")}</p>
                </div>
                <div className="ml-auto pb-1">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">{tutor.badge}</span>
                </div>
              </div>

              <div className="flex items-center gap-5 flex-wrap text-sm">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800">{tutor.rating}</span>
                  <span className="text-slate-400">({tutor.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  {tutor.sessionsCompleted} sessions completed
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-4 h-4 text-violet-500" />
                  {tutor.experience} experience
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-4 h-4 text-violet-500" />
                  {tutor.availability}
                </div>
              </div>

              <p className="text-sm text-slate-600 mt-4 leading-relaxed">{tutor.bio} With a focus on building strong foundational understanding, I tailor each session to the student's learning pace and goals.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, label: "Students Taught", value: "200+", color: "text-violet-600", bg: "bg-violet-50" },
              { icon: ThumbsUp, label: "Positive Reviews", value: "98%", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Award, label: "Response Rate", value: "< 1hr", color: "text-amber-600", bg: "bg-amber-50" },
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
              {[...tutor.subjects, "Linear Algebra", "Differential Equations", "Probability"].map(sub => (
                <span key={sub} className="px-3 py-2 bg-violet-50 border border-violet-100 text-violet-700 rounded-xl text-sm font-medium">{sub}</span>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" /> Student Reviews
            </h2>

            {/* Rating breakdown */}
            <div className="flex items-center gap-6 mb-5 p-4 bg-slate-50 rounded-xl">
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-900">{tutor.rating}</p>
                <div className="flex items-center gap-0.5 my-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-slate-500">{tutor.reviews} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3">{r}</span>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: r === 5 ? "78%" : r === 4 ? "15%" : r === 3 ? "5%" : "1%" }} />
                    </div>
                    <span className="text-xs text-slate-400">{r === 5 ? "78%" : r === 4 ? "15%" : r === 3 ? "5%" : "1%"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={r.avatar} alt={r.name} className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">{r.name}</p>
                        <span className="text-xs text-slate-400">{r.date}</span>
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`w-3 h-3 ${j < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Booking Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-4">
            <div className="text-center mb-5">
              <p className="text-3xl font-bold text-violet-600">${tutor.hourlyRate}</p>
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

            <Link to={`/booking/${tutor.id}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-700 transition-colors shadow-md shadow-violet-200">
              Book a Session <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/chat" className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">
              <MessageSquare className="w-4 h-4 text-violet-500" /> Send Message
            </Link>
            <p className="text-xs text-center text-slate-400 mt-3">Free cancellation up to 24 hours before</p>
          </div>
        </div>
      </div>
    </div>
  );
}
