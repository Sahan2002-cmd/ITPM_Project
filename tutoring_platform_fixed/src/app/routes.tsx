import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";
import BrowseTutors from "./pages/BrowseTutors";
import BookingForm from "./pages/BookingForm";
import BookingConfirmation from "./pages/BookingConfirmation";
import StudentHistory from "./pages/StudentHistory";
import TutorRegister from "./pages/TutorRegister";
import SubjectSelection from "./pages/SubjectSelection";
import AvailabilityCalendar from "./pages/AvailabilityCalendar";
import TutorProfile from "./pages/TutorProfile";
import Chat from "./pages/Chat";
import FileUpload from "./pages/FileUpload";
import SessionNotes from "./pages/SessionNotes";
import MaterialsLibrary from "./pages/MaterialsLibrary";
import SessionReview from "./pages/SessionReview";
import TutorDashboard from "./pages/TutorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import UploadRecording from "./pages/UploadRecording";
import RecordingsList from "./pages/RecordingsList";
import RecordingPlayback from "./pages/RecordingPlayback";
import AdminModeration from "./pages/AdminModeration";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";

// Wrapper: wraps each child with a role check inside the already-authed Layout
function RoleRoute({ children, roles }: { children: React.ReactNode; roles: ('student' | 'tutor' | 'admin')[] }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/login", Component: Auth },

  // ─── STUDENT ROUTES (/student/*) ───────────────────────────────────────────
  {
    path: "/student",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/student/dashboard" replace /> },
      { path: "dashboard",    element: <RoleRoute roles={["student"]}><StudentDashboard /></RoleRoute> },
      { path: "history",      element: <RoleRoute roles={["student"]}><StudentHistory /></RoleRoute> },
      { path: "recordings",   element: <RoleRoute roles={["student"]}><RecordingsList /></RoleRoute> },
      { path: "recordings/:id", element: <RoleRoute roles={["student"]}><RecordingPlayback /></RoleRoute> },
      { path: "profile",      element: <RoleRoute roles={["student"]}><UserProfile /></RoleRoute> },
      { path: "browse",       element: <RoleRoute roles={["student"]}><BrowseTutors /></RoleRoute> },
      { path: "booking/:tutorId", element: <RoleRoute roles={["student"]}><BookingForm /></RoleRoute> },
      { path: "booking-confirmation", element: <RoleRoute roles={["student"]}><BookingConfirmation /></RoleRoute> },
      { path: "chat",         element: <RoleRoute roles={["student"]}><Chat /></RoleRoute> },
      { path: "materials",    element: <RoleRoute roles={["student"]}><MaterialsLibrary /></RoleRoute> },
      { path: "session/review", element: <RoleRoute roles={["student"]}><SessionReview /></RoleRoute> },

    ],
  },

  // ─── TUTOR ROUTES (/tutor/*) ────────────────────────────────────────────────
  {
    path: "/tutor",
    element: (
      <ProtectedRoute allowedRoles={["tutor"]}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/tutor/dashboard" replace /> },
      { path: "dashboard",     element: <RoleRoute roles={["tutor"]}><TutorDashboard /></RoleRoute> },
      { path: "register",      element: <RoleRoute roles={["tutor"]}><TutorRegister /></RoleRoute> },
      { path: "subjects",      element: <RoleRoute roles={["tutor"]}><SubjectSelection /></RoleRoute> },
      { path: "availability",  element: <RoleRoute roles={["tutor"]}><AvailabilityCalendar /></RoleRoute> },
      { path: "profile/:id",   element: <RoleRoute roles={["tutor"]}><TutorProfile /></RoleRoute> },
      { path: "recording/upload", element: <RoleRoute roles={["tutor"]}><UploadRecording /></RoleRoute> },
      { path: "profile",       element: <RoleRoute roles={["tutor"]}><UserProfile /></RoleRoute> },
      { path: "chat",          element: <RoleRoute roles={["tutor"]}><Chat /></RoleRoute> },
      { path: "files/upload",  element: <RoleRoute roles={["tutor"]}><FileUpload /></RoleRoute> },
      { path: "session/notes", element: <RoleRoute roles={["tutor"]}><SessionNotes /></RoleRoute> },
    ],
  },

  // ─── ADMIN ROUTES (/admin/*) ────────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/analytics" replace /> },
      { path: "analytics",   element: <RoleRoute roles={["admin"]}><AdminAnalytics /></RoleRoute> },
      { path: "moderation",  element: <RoleRoute roles={["admin"]}><AdminModeration /></RoleRoute> },
      { path: "profile",     element: <RoleRoute roles={["admin"]}><UserProfile /></RoleRoute> },
      { path: "users", element: <RoleRoute roles={["admin"]}><AdminUsers /></RoleRoute> },
      { path: "reports", element: <RoleRoute roles={["admin"]}><AdminReports /></RoleRoute> },
    ],
  },

  // ─── LEGACY /app/* REDIRECTS (old bookmarks still work) ────────────────────
  { path: "/app/student/dashboard",   element: <Navigate to="/student/dashboard" replace /> },
  { path: "/app/tutor/dashboard",     element: <Navigate to="/tutor/dashboard" replace /> },
  { path: "/app/admin/analytics",     element: <Navigate to="/admin/analytics" replace /> },
  { path: "/app/*",                   element: <Navigate to="/login" replace /> },

  // ─── CATCH-ALL ──────────────────────────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
]);
