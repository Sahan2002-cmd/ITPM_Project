import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  CreditCard, Lock, Calendar, Clock, ChevronLeft, AlertCircle,
  Loader2, CheckCircle, Shield, User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createBooking } from "../services/Module_02_API";

interface PaymentState {
  tutorId: string;
  tutorName: string;
  subjects: string[];
  sessionDate: string;
  startTime: string;
  endTime: string;
  sessionType: "individual" | "group";
  price: number;
  durationMinutes: number;
  selectedSlotId: string;
  tutorUserId: number;
}

type FieldErrors = Record<string, string>;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

type CardType = "visa" | "mastercard" | "amex" | "discover" | null;

function detectCardType(number: string): CardType {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  return null;
}

const CARD_TYPE_LABELS: Record<NonNullable<CardType>, { label: string; color: string }> = {
  visa:       { label: "VISA",       color: "text-blue-600 bg-blue-50" },
  mastercard: { label: "MC",         color: "text-red-600 bg-red-50" },
  amex:       { label: "AMEX",       color: "text-green-600 bg-green-50" },
  discover:   { label: "DISC",       color: "text-orange-600 bg-orange-50" },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as PaymentState | null;

  const [cardNumber, setCardNumber]   = useState("");
  const [cardHolder, setCardHolder]   = useState("");
  const [expiry, setExpiry]           = useState("");
  const [cvv, setCvv]                 = useState("");
  const [saveCard, setSaveCard]       = useState(false);

  const [errors, setErrors]           = useState<FieldErrors>({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Guard: navigated here directly without booking state
  if (!state) {
    navigate("/student/browse", { replace: true });
    return null;
  }

  const cardType = detectCardType(cardNumber);

  const clearError = (field: string) =>
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    const rawCard = cardNumber.replace(/\s/g, "");

    // Card number
    if (!rawCard) {
      errs.cardNumber = "Card number is required.";
    } else if (rawCard.length !== 16) {
      errs.cardNumber = "Card number must be 16 digits.";
    }

    // Cardholder
    if (!cardHolder.trim()) {
      errs.cardHolder = "Cardholder name is required.";
    } else if (cardHolder.trim().length < 3) {
      errs.cardHolder = "Name must be at least 3 characters.";
    } else if (cardHolder.trim().length > 50) {
      errs.cardHolder = "Name must be 50 characters or fewer.";
    } else if (!/^[a-zA-Z\s'.-]+$/.test(cardHolder.trim())) {
      errs.cardHolder = "Name must contain only letters.";
    }

    // Expiry
    if (!expiry) {
      errs.expiry = "Expiry date is required.";
    } else {
      const parts = expiry.split("/");
      const month = parseInt(parts[0] ?? "", 10);
      const year  = parseInt("20" + (parts[1] ?? ""), 10);
      const now   = new Date();
      if (isNaN(month) || isNaN(year) || parts.length !== 2) {
        errs.expiry = "Enter a valid expiry date (MM/YY).";
      } else if (month < 1 || month > 12) {
        errs.expiry = "Month must be between 01 and 12.";
      } else if (new Date(year, month - 1, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) {
        errs.expiry = "Card has expired.";
      }
    }

    // CVV
    if (!cvv) {
      errs.cvv = "CVV is required.";
    } else if (!/^\d{3,4}$/.test(cvv)) {
      errs.cvv = "CVV must be 3 or 4 digits.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (!validate() || !user?.userId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createBooking({
        AvailabilityId: state.selectedSlotId,
        TutorProfileId: state.tutorId,
        TutorId:        state.tutorUserId,
        StudentId:      user.userId,
      });
      navigate("/student/booking-confirmation", {
        state: {
          bookingId:       res?.Data?.BookingId ?? null,
          tutorName:       state.tutorName,
          subjects:        state.subjects,
          sessionDate:     state.sessionDate,
          startTime:       state.startTime,
          endTime:         state.endTime,
          sessionType:     state.sessionType,
          price:           state.price,
          durationMinutes: state.durationMinutes,
        },
      });
    } catch (err: any) {
      setSubmitError(err.message || "Payment failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Booking
      </button>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {["Select Session", "Payment", "Confirmation"].map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              i === 0 ? "bg-emerald-500 text-white" :
              i === 1 ? "bg-violet-600 text-white" :
              "bg-slate-100 text-slate-400"
            }`}>
              {i === 0 ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              i === 0 ? "text-emerald-600" :
              i === 1 ? "text-violet-700" :
              "text-slate-400"
            }`}>{label}</span>
            {i < 2 && <div className={`flex-1 h-px ${i === 0 ? "bg-emerald-300" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Card Form ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Demo notice
          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Demo Gateway</strong> — This is a simulated payment form. No real charges will be made.
              Do not enter actual card details.
            </span>
          </div> */}

          {/* Card Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-600" /> Card Details
            </h2>

            {/* Card Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Card Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={e => {
                    setCardNumber(formatCardNumber(e.target.value));
                    clearError("cardNumber");
                  }}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 font-mono tracking-widest pr-20 ${
                    errors.cardNumber ? "border-rose-400 bg-rose-50" : "border-slate-200"
                  }`}
                />
                {/* Detected card type badge */}
                {cardType && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-bold ${CARD_TYPE_LABELS[cardType].color}`}>
                    {CARD_TYPE_LABELS[cardType].label}
                  </span>
                )}
              </div>
              {errors.cardNumber && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{errors.cardNumber}
                </p>
              )}
            </div>

            {/* Cardholder Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Cardholder Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={cardHolder}
                  onChange={e => {
                    setCardHolder(e.target.value);
                    clearError("cardHolder");
                  }}
                  placeholder="Name as shown on card"
                  className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 ${
                    errors.cardHolder ? "border-rose-400 bg-rose-50" : "border-slate-200"
                  }`}
                />
              </div>
              {errors.cardHolder && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{errors.cardHolder}
                </p>
              )}
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Expiry Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={e => {
                      setExpiry(formatExpiry(e.target.value));
                      clearError("expiry");
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 font-mono ${
                      errors.expiry ? "border-rose-400 bg-rose-50" : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.expiry && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{errors.expiry}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  CVV <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={cvv}
                    onChange={e => {
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
                      clearError("cvv");
                    }}
                    placeholder="•••"
                    maxLength={4}
                    className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 ${
                      errors.cvv ? "border-rose-400 bg-rose-50" : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.cvv && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{errors.cvv}
                  </p>
                )}
              </div>
            </div>

            {/* Save card */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={e => setSaveCard(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-violet-600"
              />
              <span className="text-sm text-slate-600">Save card for future payments</span>
            </label>
          </div>

          {/* Accepted card logos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-400 mb-3">Accepted Cards</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "VISA",       color: "text-blue-600   bg-blue-50   border-blue-100"   },
                { label: "MasterCard", color: "text-red-600    bg-red-50    border-red-100"    },
                { label: "AMEX",       color: "text-green-600  bg-green-50  border-green-100"  },
                { label: "Discover",   color: "text-orange-600 bg-orange-50 border-orange-100" },
              ].map(c => (
                <span key={c.label} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${c.color}`}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Order Summary ──────────────────────────────────────── */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-4">
            <h3 className="font-semibold text-slate-800 mb-4">Order Summary</h3>

            {/* Tutor mini-card */}
            <div className="flex gap-3 items-center mb-5 p-3 bg-violet-50 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg flex-shrink-0">
                {state.tutorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">{state.tutorName}</p>
                <p className="text-xs text-violet-600">{state.subjects[0] ?? "Session"}</p>
              </div>
            </div>

            {/* Session info */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                <span>{state.sessionDate}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                <span>{state.startTime} – {state.endTime} SLST</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CreditCard className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                <span className="capitalize">{state.sessionType} · {state.durationMinutes} min</span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Session fee</span>
                <span>Rs. {state.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Processing fee</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span className="text-violet-600 text-base">Rs. {state.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-xs text-rose-700 font-medium flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Booking Failed
                </p>
                <p className="text-xs text-rose-600">{submitError}</p>
                {(submitError.toLowerCase().includes("slot") ||
                  submitError.toLowerCase().includes("overlap") ||
                  submitError.toLowerCase().includes("available") ||
                  submitError.toLowerCase().includes("booking")) && (
                  <button
                    onClick={() => navigate(-1)}
                    className="mt-2 text-xs text-violet-600 underline hover:text-violet-800"
                  >
                    ← Go back and choose a different time slot
                  </button>
                )}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={submitting}
              className="w-full mt-5 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Lock className="w-4 h-4" /> Pay Rs. {state.price.toLocaleString()}</>
              )}
            </button>

            {/* SSL note */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">256-bit SSL encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
