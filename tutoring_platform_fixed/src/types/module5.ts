export type RecordingVisibility = "enrolled" | "all" | "private";

export type RecordingChapter = {
  time: string;
  label: string;
};

export type Recording = {
  id: string;
  title: string;
  tutor: string;
  tutorEmail?: string;
  tutorRating?: number;
  tutorReviewCount?: number;
  avatar: string;
  date: string;
  duration: string;
  subject: string;
  thumbnail: string;
  views: number;
  description?: string;
  visibility?: RecordingVisibility;
  tags?: string[];
  fileName?: string;
  filePath?: string;
  videoUrl?: string;
  fileSizeMB?: number;
  chapters?: RecordingChapter[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateRecordingPayload = {
  title: string;
  subject: string;
  description?: string;
  tutor: string;
  tutorEmail?: string;
  avatar?: string;
  duration?: string;
  thumbnail?: string;
  visibility?: RecordingVisibility;
  tags?: string[];
  chapters?: RecordingChapter[];
  fileName?: string;
  fileSizeMB?: number;
};

export type ReportType = "content" | "behavior" | "fraud" | "spam";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type ReportPriority = "high" | "medium" | "low";

export type ModerationReport = {
  id: string;
  recordingId: string;
  recordingTitle?: string;
  type: ReportType;
  title: string;
  reporter: string;
  reported: string;
  reportedAvatar: string;
  date: string;
  status: ReportStatus;
  priority: ReportPriority;
  description: string;
  sessionId: string;
  adminNote?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateModerationReportPayload = {
  recordingId: string;
  type: ReportType;
  priority?: ReportPriority;
  description: string;
  reporter: string;
  title?: string;
};

export type MeetingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Meeting = {
  id: string;
  tutorName: string;
  tutorEmail: string;
  tutorAvatar?: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  isForAllStudents?: boolean;
  subject: string;
  scheduledFor: string;
  durationMinutes: number;
  meetingLink?: string;
  isLive?: boolean;
  status: MeetingStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateMeetingPayload = {
  studentName?: string;
  studentEmail?: string;
  studentAvatar?: string;
  isForAllStudents?: boolean;
  subject: string;
  scheduledFor: string;
  durationMinutes?: number;
  meetingLink?: string;
  notes?: string;
};
