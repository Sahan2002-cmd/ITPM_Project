import { useState } from "react";
import { Link } from "react-router";
import { Star, Search, Filter, Clock, BookOpen, ChevronRight, BadgeCheck } from "lucide-react";
import { tutors, subjects } from "../data/mockData";

const BADGE_COLORS: Record<string, string> = {
  "Top Rated": "bg-amber-100 text-amber-700",
  "Expert": "bg-violet-100 text-violet-700",
  "Pro": "bg-blue-100 text-blue-700",
  "Rising Star": "bg-emerald-100 text-emerald-700",
};

export default function BrowseTutors() {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [priceRange, setPriceRange] = useState("All");
  const [sortBy, setSortBy] = useState("rating");

  const filtered = tutors.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchSubject = selectedSubject === "All" || t.subjects.includes(selectedSubject);
    const matchPrice = priceRange === "All" || (priceRange === "<40" && t.hourlyRate < 40) || (priceRange === "40-50" && t.hourlyRate >= 40 && t.hourlyRate <= 50) || (priceRange === ">50" && t.hourlyRate > 50);
    return matchSearch && matchSubject && matchPrice;
  });

  const popularSubjects = ["All", "Mathematics", "Physics", "Programming", "English", "Chemistry"];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Browse Tutors</h1>
        <p className="text-slate-500 mt-1">Find the perfect tutor for your learning goals</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or subject..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
          >
            <option value="All">Any Price</option>
            <option value="<40">Under $40/hr</option>
            <option value="40-50">$40 - $50/hr</option>
            <option value=">50">$50+/hr</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
          >
            <option value="rating">Sort: Top Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="reviews">Most Reviews</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" /> More Filters
          </button>
        </div>

        {/* Subject Chips */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {popularSubjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedSubject === sub
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">{filtered.length} tutors found</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {filtered.map((tutor) => (
          <div key={tutor.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-violet-200 transition-all duration-200 group">
            <div className="flex gap-4">
              <img src={tutor.avatar} alt={tutor.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{tutor.name}</h3>
                      <BadgeCheck className="w-4 h-4 text-violet-500" />
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${BADGE_COLORS[tutor.badge] || "bg-slate-100 text-slate-600"}`}>
                      {tutor.badge}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-violet-600">${tutor.hourlyRate}<span className="text-xs text-slate-400 font-normal">/hr</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-slate-700">{tutor.rating}</span>
                    <span className="text-xs text-slate-400">({tutor.reviews})</span>
                  </div>
                  <span className="text-slate-200">|</span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" /> {tutor.experience}
                  </div>
                  <span className="text-slate-200">|</span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <BookOpen className="w-3 h-3" /> {tutor.sessionsCompleted} sessions
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 mt-3 line-clamp-2">{tutor.bio}</p>

            <div className="flex gap-1.5 flex-wrap mt-3">
              {tutor.subjects.map((sub) => (
                <span key={sub} className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium">{sub}</span>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Link
                to={`/tutor/profile/${tutor.id}`}
                className="flex-1 text-center py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                View Profile
              </Link>
              <Link
                to={`/student/booking/${tutor.id}`}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors"
              >
                Book Session <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
