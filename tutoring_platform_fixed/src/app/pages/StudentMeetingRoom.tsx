import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  Clock,
  Mic,
  MicOff,
  MonitorPlay,
  PhoneOff,
  RefreshCw,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";
import { getMeeting } from "../services/Module_05_API";
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

export default function StudentMeetingRoom() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [meetingError, setMeetingError] = useState("");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [joined, setJoined] = useState(false);
  const [startingMedia, setStartingMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const stopCurrentStream = () => {
    setLocalStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  };

  const startMedia = async () => {
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
      setJoined(true);
      toast.success("You joined the meeting");
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
        const message = error instanceof Error ? error.message : "Failed to load meeting";
        if (message.toLowerCase().includes("not started")) {
          setMeetingError("Tutor has not started this meeting yet. Please try again in a moment.");
        } else {
          setMeetingError(message);
        }
      } finally {
        setLoadingMeeting(false);
      }
    };

    void loadMeeting();

    return () => {
      stopCurrentStream();
    };
  }, [meetingId]);

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

  const leaveMeeting = () => {
    stopCurrentStream();
    setJoined(false);
    navigate("/student/meetings");
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
          to="/student/meetings"
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
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          to="/student/meetings"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Meetings
        </Link>

        <button
          onClick={() => void startMedia()}
          disabled={startingMedia}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {joined ? <RefreshCw className="w-4 h-4" /> : <MonitorPlay className="w-4 h-4" />} {startingMedia ? "Starting..." : joined ? "Restart Camera/Mic" : "Join Meeting"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Live Class</h2>
              <p className="text-xs text-slate-500">{meeting.subject}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
              <Clock className="w-3.5 h-3.5" /> {meeting.durationMinutes} min
            </span>
          </div>

          <div className="relative bg-black aspect-video flex items-center justify-center">
            {localStream ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center px-4">
                <p className="text-sm text-white font-medium">Click Join Meeting to start your camera and microphone.</p>
              </div>
            )}

            {localStream && !videoEnabled && (
              <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center">
                <p className="text-sm text-white">Camera is off</p>
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

            <button
              onClick={leaveMeeting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-rose-600 text-white hover:bg-rose-700 ml-auto"
            >
              <PhoneOff className="w-4 h-4" /> Leave Meeting
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
              Tutor: <span className="font-medium text-slate-800">{meeting.tutorName}</span>
            </p>
            {meeting.isForAllStudents && (
              <p className="text-sm text-indigo-600 mt-1 inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Audience: All Students
              </p>
            )}
            <p className="text-sm text-slate-600 mt-1">
              Scheduled: <span className="font-medium text-slate-800">{formatDateTime(meeting.scheduledFor)}</span>
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
            <h3 className="font-semibold text-slate-800 mb-2">Microphone</h3>
            <p className="text-sm text-slate-600">
              Use <span className="font-medium">Mute/Unmute</span> to control your voice during the meeting.
            </p>
            <p className="text-sm text-slate-600 mt-2">
              If permission was blocked, click <span className="font-medium">Join Meeting</span> again after allowing access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
