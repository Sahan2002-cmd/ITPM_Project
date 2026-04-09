import { Link } from "react-router";
import { CheckCircle, Calendar, Clock, Video, Download, MessageSquare, ArrowRight } from "lucide-react";
import { tutors } from "../data/mockData";

export default function BookingConfirmation() {
  const tutor = tutors[0];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Success Banner */}
      <div className="text-center mb-8 mt-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h1>
        <p className="text-slate-500 mt-2">Your session has been scheduled. A confirmation email has been sent to you.</p>
      </div>

      {/* Booking Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        {/* Booking ID Banner */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-200 text-xs font-medium">Booking Reference</p>
              <p className="text-white font-bold text-lg">#BK-2026-3052</p>
            </div>
            <button className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors">
              <Download className="w-3.5 h-3.5" /> Receipt
            </button>
          </div>
        </div>

        {/* Session Details */}
        <div className="p-6">
          <div className="flex gap-4 items-start mb-6">
            <img src={tutor.avatar} alt={tutor.name} className="w-14 h-14 rounded-xl object-cover" />
            <div>
              <h3 className="font-semibold text-slate-900">{tutor.name}</h3>
              <p className="text-sm text-slate-500">Mathematics — Calculus</p>
              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium mt-1">Confirmed</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Calendar, label: "Date", value: "March 5, 2026" },
              { icon: Clock, label: "Time", value: "10:00 AM – 11:00 AM" },
              { icon: Video, label: "Format", value: "1-on-1 Video Call" },
              { icon: Clock, label: "Duration", value: "60 minutes" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 mt-5 pt-4 flex justify-between items-center">
            <span className="text-sm text-slate-500">Total Paid</span>
            <span className="text-xl font-bold text-violet-600">$45.00</span>
          </div>
        </div>
      </div>

      {/* Preparation Tips */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 mb-5">
        <h3 className="font-semibold text-violet-900 mb-3">Prepare for Your Session</h3>
        <ul className="space-y-2">
          {[
            "Test your camera and microphone before the session",
            "Have your questions and materials ready",
            "Join the session link 5 minutes early",
            "Make sure you have a quiet, well-lit space",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-violet-700">
              <CheckCircle className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/chat"
          className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-violet-500" /> Message Tutor
        </Link>
        <Link
          to="/student/history"
          className="flex items-center justify-center gap-2 py-3 bg-violet-600 rounded-xl text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          View Bookings <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
