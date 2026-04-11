import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  Circle,
  Download,
  Mic,
  MicOff,
  MonitorPlay,
  PhoneOff,
  RefreshCw,
  Video,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  createRecordingFromMedia,
  getMeeting,
  updateMeetingStatus,
} from "../services/Module_05_API";
import type { Meeting } from "../types/module5";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function pickRecordingMimeType() {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  const match = candidates.find((type) => MediaRecorder.isTypeSupported(type));
  return match || "";
}

function extensionFromMime(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

export default function TutorMeetingRoom() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [meetingError, setMeetingError] = useState("");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [startingMedia, setStartingMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [endingMeeting, setEndingMeeting] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [leavingRoom, setLeavingRoom] = useState(false);

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const stopCurrentStream = () => {
    setLocalStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  };

  const uploadMeetingRecording = async (blob: Blob, recordedSeconds: number) => {
    if (!meeting) return;

    setUploadingRecording(true);
    try {
      const mimeType = blob.type || "video/webm";
      const extension = extensionFromMime(mimeType);
      const stamp = new Date().toISOString().replace(/[.:]/g, "-");
      const fileName = `meeting-${meeting.id}-${stamp}.${extension}`;

      const file = new File([blob], fileName, { type: mimeType });

      await createRecordingFromMedia(file, {
        title: `${meeting.subject} Live Meeting - ${meeting.studentName}`,
        subject: meeting.subject,
        description: `Recorded meeting with ${meeting.studentName} (${meeting.studentEmail}) at ${formatDateTime(
          meeting.scheduledFor
        )}`,
        duration: toClock(recordedSeconds),
        visibility: "enrolled",
        tags: ["live-meeting", `meeting-${meeting.id}`],
      });

      toast.success("Meeting recording saved to Recordings");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload meeting recording");
    } finally {
      setUploadingRecording(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  };

  const startRecording = () => {
    if (!localStream) {
      toast.error("Camera and microphone are not ready");
      return;
    }

    if (isRecording) return;

    if (typeof MediaRecorder === "undefined") {
      toast.error("Recording is not supported in this browser");
      return;
    }

    const mimeType = pickRecordingMimeType();

    try {
      recordedChunksRef.current = [];
      const recorder = mimeType
        ? new MediaRecorder(localStream, { mimeType })
        : new MediaRecorder(localStream);

      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);
      setIsRecording(true);

      clearRecordingTimer();
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearRecordingTimer();
        setIsRecording(false);

        const startAt = recordingStartedAtRef.current || Date.now();
        const durationSeconds = Math.max(1, Math.round((Date.now() - startAt) / 1000));
        recordingStartedAtRef.current = null;

        const effectiveType = recorder.mimeType || mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: effectiveType });
        recordedChunksRef.current = [];

        setLastRecordingUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });

        void uploadMeetingRecording(blob, durationSeconds);
      };

      recorder.onerror = () => {
        clearRecordingTimer();
        setIsRecording(false);
        toast.error("Recording failed");
      };

      recorder.start(1000);
      toast.success("Recording started");
    } catch (error) {
      clearRecordingTimer();
      setIsRecording(false);
      toast.error(error instanceof Error ? error.message : "Could not start recording");
    }
  };

  const startMedia = async () => {
    if (isRecording) {
      toast.error("Stop recording before restarting camera/microphone");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("This browser does not support camera and microphone access.");
      return;
    }

    setStartingMedia(true);
    setMediaError("");

    try {
      stopCurrentStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      setAudioEnabled(true);
      setVideoEnabled(true);
      toast.success("Camera and microphone are now on");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to access camera/microphone. Please allow permissions.";
      setMediaError(message);
      toast.error("Could not start webcam/microphone");
    } finally {
      setStartingMedia(false);
    }
  };

  useEffect(() => {
    if (!meetingId) {
      setMeetingError("Meeting id is missing");
      setLoadingMeeting(false);
      return;
    }

    const loadMeeting = async () => {
      setLoadingMeeting(true);
      setMeetingError("");

      try {
        const item = await getMeeting(meetingId);
        setMeeting(item);
      } catch (error) {
        setMeetingError(error instanceof Error ? error.message : "Failed to load meeting");
      } finally {
        setLoadingMeeting(false);
      }
    };

    void loadMeeting();
  }, [meetingId]);

  useEffect(() => {
    void startMedia();

    return () => {
      stopRecording();
      stopCurrentStream();
      clearRecordingTimer();
      setLastRecordingUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !localStream) return;
    videoRef.current.srcObject = localStream;
    void videoRef.current.play().catch(() => {
      // Ignore autoplay rejections.
    });
  }, [localStream]);

  const toggleAudio = () => {
    if (!localStream) return;
    const next = !audioEnabled;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setAudioEnabled(next);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const next = !videoEnabled;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setVideoEnabled(next);
  };

  const endMeeting = async () => {
    if (!meeting) {
      navigate("/tutor/meetings");
      return;
    }

    if (isRecording) {
      toast.error("Stop recording before ending meeting");
      return;
    }

    setEndingMeeting(true);
    try {
      await updateMeetingStatus(
        meeting.id,
        "completed",
        meeting.notes || "",
        meeting.meetingLink || "",
        false
      );
      toast.success("Meeting ended");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update meeting status");
    } finally {
      stopCurrentStream();
      setEndingMeeting(false);
      navigate("/tutor/meetings");
    }
  };

  const leaveRoom = async () => {
    if (!meeting) {
      navigate("/tutor/meetings");
      return;
    }

    if (isRecording) {
      toast.error("Stop recording before leaving room");
      return;
    }

    setLeavingRoom(true);
    try {
      await updateMeetingStatus(
        meeting.id,
        meeting.status === "pending" ? "confirmed" : meeting.status,
        meeting.notes || "",
        meeting.meetingLink || "",
        false
      );
    } catch {
      // Keep navigation flow even if live-state update fails.
    } finally {
      stopCurrentStream();
      setLeavingRoom(false);
      navigate("/tutor/meetings");
    }
  };

  if (loadingMeeting) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
          Loading meeting room...
        </div>
      </div>
    );
  }

  if (meetingError || !meeting) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Link
          to="/tutor/meetings"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Meetings
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-700">
          {meetingError || "Meeting not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link to="/tutor/meetings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ChevronLeft className="w-4 h-4" /> Back to Meetings
        </Link>
        <button
          onClick={() => void startMedia()}
          disabled={startingMedia || isRecording}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" /> {startingMedia ? "Starting..." : "Restart Camera/Mic"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Live Meeting</h2>
              <p className="text-xs text-slate-500">{meeting.subject}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <MonitorPlay className="w-3.5 h-3.5" /> Live
            </span>
          </div>

          <div className="relative bg-black aspect-video flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            {!videoEnabled && (
              <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center">
                <p className="text-sm text-white">Camera is off</p>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs px-2.5 py-1 rounded-full">
                <Circle className="w-3.5 h-3.5 fill-white text-white" /> REC {toClock(recordingSeconds)}
              </div>
            )}

            {mediaError && (
              <div className="absolute top-3 left-3 right-3 bg-rose-500/90 text-white text-xs rounded-lg px-3 py-2">
                {mediaError}
              </div>
            )}
          </div>

          <div className="p-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleAudio}
              disabled={!localStream}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm ${
                audioEnabled ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
              } disabled:opacity-50`}
            >
              {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />} {audioEnabled ? "Mute" : "Unmute"}
            </button>

            <button
              onClick={toggleVideo}
              disabled={!localStream}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm ${
                videoEnabled ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
              } disabled:opacity-50`}
            >
              {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />} {videoEnabled ? "Stop Video" : "Start Video"}
            </button>

            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!localStream || uploadingRecording}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Circle className="w-4 h-4" /> Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-amber-500 text-white hover:bg-amber-600"
              >
                <Circle className="w-4 h-4" /> Stop Recording
              </button>
            )}

            <button
              onClick={() => void leaveRoom()}
              disabled={leavingRoom}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-slate-100 text-slate-700"
            >
              {leavingRoom ? "Leaving..." : "Leave Room"}
            </button>

            <button
              onClick={() => void endMeeting()}
              disabled={endingMeeting || uploadingRecording}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 ml-auto"
            >
              <PhoneOff className="w-4 h-4" /> {endingMeeting ? "Ending..." : "End Meeting"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">Meeting Details</h3>
            <p className="text-sm text-slate-600">
              Subject: <span className="font-medium text-slate-800">{meeting.subject}</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Student: <span className="font-medium text-slate-800">{meeting.studentName}</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Scheduled: <span className="font-medium text-slate-800">{formatDateTime(meeting.scheduledFor)}</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Duration: <span className="font-medium text-slate-800">{meeting.durationMinutes} min</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Status: <span className="font-medium text-slate-800 capitalize">{meeting.status}</span>
            </p>
            {meeting.meetingLink && (
              <p className="text-sm text-slate-600 mt-1 break-all">
                Link: <span className="font-medium text-slate-800">{meeting.meetingLink}</span>
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">Recording Status</h3>
            <p className="text-sm text-slate-600">
              {isRecording
                ? `Recording in progress (${toClock(recordingSeconds)})`
                : "Recording is currently stopped."}
            </p>
            {uploadingRecording && <p className="text-sm text-violet-600 mt-2">Uploading recorded file...</p>}
            {lastRecordingUrl && !uploadingRecording && (
              <a
                href={lastRecordingUrl}
                download={`meeting-${meeting.id}.webm`}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-violet-600 text-white hover:bg-violet-700"
              >
                <Download className="w-4 h-4" /> Download Last Recording
              </a>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">Permission Note</h3>
            <p className="text-sm text-slate-600">
              Browser asks camera/microphone permission when this page opens.
              If blocked, allow permissions and click <span className="font-medium">Restart Camera/Mic</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
