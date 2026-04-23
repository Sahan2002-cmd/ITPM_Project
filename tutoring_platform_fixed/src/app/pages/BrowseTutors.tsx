import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Star, Search, Clock, BookOpen, ChevronRight, BadgeCheck, Loader2 } from "lucide-react";
import { getAllTutors } from "../services/Module_01_API";

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
}

export default function BrowseTutors() {
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showPending, setShowPending] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [priceRange, setPriceRange] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    getAllTutors()
      .then((res: any) => {
        const data = res.Data ?? res ?? [];
        setTutors(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => setError(err.message || "Failed to load tutors"))
      .finally(() => setLoading(false));
  }, []);

  const subjectsFromTutors = ["All", ...Array.from(new Set(tutors.flatMap(t => t.SubjectsTaught ?? [])))];
  const popularSubjects = subjectsFromTutors.slice(0, 7);

  const filtered = tutors
    .filter((t) => {
      const isVisible = showPending ? true : t.Status === "Active";
      const matchSearch =
        t.FullName.toLowerCase().includes(search.toLowerCase()) ||
        (t.SubjectsTaught ?? []).some(s => s.toLowerCase().includes(search.toLowerCase()));
      const matchSubject = selectedSubject === "All" || (t.SubjectsTaught ?? []).includes(selectedSubject);
      const matchPrice =
        priceRange === "All" ||
        (priceRange === "<2000" && t.HourlyRate < 2000) ||
        (priceRange === "2000-3500" && t.HourlyRate >= 2000 && t.HourlyRate <= 3500) ||
        (priceRange === ">3500" && t.HourlyRate > 3500);
      return isVisible && matchSearch && matchSubject && matchPrice;
    })
    .sort((a, b) =>
      sortBy === "price_low" ? a.HourlyRate - b.HourlyRate :
      sortBy === "price_high" ? b.HourlyRate - a.HourlyRate :
      a.FullName.localeCompare(b.FullName)
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse Tutors</h1>
          <p className="text-slate-500 mt-1">Find the perfect tutor for your learning goals</p>
        </div>
        <button 
          onClick={() => setShowPending(!showPending)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${showPending ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
        >
          {showPending ? "Showing All Profiles" : "Show Pending Profiles (Test Mode)"}
        </button>
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
            <option value="<2000">Under Rs. 2,000/hr</option>
            <option value="2000-3500">Rs. 2,000 – 3,500/hr</option>
            <option value=">3500">Rs. 3,500+/hr</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
          >
            <option value="name">Sort: A – Z</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
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
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-rose-600">{error}</div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">{filtered.length} tutor{filtered.length !== 1 ? "s" : ""} found</p>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium">No tutors found matching your criteria.</p>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                {showPending 
                  ? "Try adjusting your search filters or subjects." 
                  : "Some tutors might still be awaiting admin approval. Click 'Show Pending' to see them."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
              {filtered.map((tutor) => (
                <div key={tutor.Id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-violet-200 transition-all duration-200 group">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 text-xl font-bold text-violet-700">
                      {tutor.FullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{tutor.FullName}</h3>
                            {tutor.IsVerified && <BadgeCheck className="w-4 h-4 text-violet-500" />}
                          </div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 bg-violet-100 text-violet-700">
                            {tutor.IsVerified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-violet-600">
                            Rs. {tutor.HourlyRate.toLocaleString()}
                            <span className="text-xs text-slate-400 font-normal">/hr</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" /> {tutor.YearsOfExperience} yr{tutor.YearsOfExperience !== 1 ? "s" : ""} exp
                        </div>
                        <span className="text-slate-200">|</span>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <BookOpen className="w-3 h-3" /> {(tutor.SubjectsTaught ?? []).length} subjects
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">{tutor.Bio}</p>

                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {(tutor.SubjectsTaught ?? []).map((sub) => (
                      <span key={sub} className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium">{sub}</span>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/tutor/profile/${tutor.Id}`}
                      className="flex-1 text-center py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/student/booking/${tutor.Id}`}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors"
                    >
                      Book Session <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
