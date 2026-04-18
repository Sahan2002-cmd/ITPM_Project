import { useState, useEffect } from "react";
import {
  FileText, Save, Check, Clock, BookOpen, Loader2,
  AlertCircle, Lock, CheckCircle, Upload, Paperclip
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getSessionNote, submitSessionNote, editSessionNote,
  uploadFileResource, getFileResourcesByBooking
} from "../services/Module_03_API";
import { toast } from "sonner";

const MIN_TOPICS = 10;

export default function SessionNotes() {
  const { user } = useAuth();
  const isTutor = user?.role === "tutor";

  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // note data
  const [noteId, setNoteId] = useState<number | null>(null);
  const [topicsCovered, setTopicsCovered] = useState("");
  const [homework, setHomework] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [noteCreatedAt, setNoteCreatedAt] = useState<string | null>(null);
  const [existsOnServer, setExistsOnServer] = useState(false);

  // files / homework
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // time window
  const isEditWindowOpen = () => {
    if (!noteCreatedAt) return true; // new note
    return (Date.now() - new Date(noteCreatedAt).getTime()) < 24 * 60 * 60 * 1000;
  };

  /* ── load note for booking ── */
  const loadNote = async () => {
    const bid = Number(bookingId);
    if (!bid) return;
    setLoading(true);
    try {
      const res = await getSessionNote(bid);
      const note = res?.Data ?? res?.data ?? res;

      // also load files
      try {
        const fres = await getFileResourcesByBooking(bid);
        const fArr = Array.isArray(fres) ? fres : (fres?.Data ?? fres?.data ?? []);
        setFiles(Array.isArray(fArr) ? fArr : []);
      } catch (e) {
        setFiles([]);
      }

      if (note && (note.NoteId || note.noteId)) {
        setNoteId(note.NoteId ?? note.noteId);
        setTopicsCovered(note.TopicsCovered ?? note.topicsCovered ?? "");
        setHomework(note.Homework ?? note.homework ?? "");
        setNextSteps(note.NextSteps ?? note.nextSteps ?? "");
        setNoteCreatedAt(note.CreatedAt ?? note.createdAt ?? null);
        setExistsOnServer(true);
      } else {
        resetForm();
      }
    } catch {
      resetForm();
    }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setNoteId(null);
    setTopicsCovered("");
    setHomework("");
    setNextSteps("");
    setNoteCreatedAt(null);
    setExistsOnServer(false);
    setFiles([]);
  };

  useEffect(() => { if (bookingId) loadNote(); }, [bookingId]);

  /* ── save (submit or edit) ── */
  const handleSave = async () => {
    const bid = Number(bookingId);
    if (!bid) { toast.error("Enter a valid Booking ID"); return; }

    if (topicsCovered.trim().length < MIN_TOPICS) {
      toast.error(`Topics covered must be at least ${MIN_TOPICS} characters.`);
      return;
    }

    setSaving(true);
    try {
      if (existsOnServer && noteId) {
        // edit
        await editSessionNote(noteId, {
          topicsCovered: topicsCovered.trim(),
          homework: homework.trim(),
          nextSteps: nextSteps.trim()
        });
      } else {
        // create
        await submitSessionNote(bid, topicsCovered.trim(), homework.trim(), nextSteps.trim());
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success(existsOnServer ? "Note updated!" : "Note submitted!");
      // reload to get the noteId / timestamps
      await loadNote();
    } catch (e: any) {
      toast.error(e.message || "Failed to save note");
    }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bookingId) return;

    setUploading(true);
    try {
      await uploadFileResource(Number(bookingId), file);
      toast.success("Homework uploaded successfully!");
      // Reload files
      const fres = await getFileResourcesByBooking(Number(bookingId));
      const fArr = Array.isArray(fres) ? fres : (fres?.Data ?? fres?.data ?? []);
      setFiles(Array.isArray(fArr) ? fArr : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      // reset input
      e.target.value = '';
    }
  };

  const canEdit = isTutor && isEditWindowOpen();
  const windowExpired = existsOnServer && !isEditWindowOpen();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Session Notes</h1>
          <p className="text-slate-500 mt-1">
            {isTutor ? "Document session progress and key takeaways" : "View notes from your tutoring sessions"}
          </p>
        </div>
        {isTutor && canEdit && (
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${saved ? "bg-emerald-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700"} disabled:opacity-50`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : existsOnServer ? "Update Notes" : "Submit Notes"}
          </button>
        )}
      </div>

      {/* Booking Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Booking ID</label>
        <input type="number" value={bookingId} onChange={e => { setBookingId(e.target.value); resetForm(); }}
          placeholder="Enter booking ID to view/write session notes..."
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white" />
      </div>

      {!bookingId ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <BookOpen className="w-12 h-12 opacity-30" />
          <p className="text-sm">Enter a Booking ID to view or write session notes</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Editor / Viewer */}
          <div className="lg:col-span-2 space-y-4">
            {/* Status Banner */}
            {windowExpired && isTutor && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Edit window expired</p>
                  <p className="text-xs text-amber-600">The 24-hour editing window has closed. Notes are now read-only.</p>
                </div>
              </div>
            )}

            {existsOnServer && !isTutor && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-800">Session notes submitted by your tutor</p>
              </div>
            )}

            {/* Topics Covered */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-600" />
                  Topics Covered <span className="text-rose-500">*</span>
                </h3>
                {topicsCovered.length > 0 && (
                  <span className={`text-xs ${topicsCovered.trim().length < MIN_TOPICS ? "text-rose-500" : "text-slate-400"}`}>
                    {topicsCovered.trim().length} chars (min {MIN_TOPICS})
                  </span>
                )}
              </div>
              {canEdit ? (
                <textarea value={topicsCovered} onChange={e => setTopicsCovered(e.target.value)}
                  placeholder="Describe what was covered in this session... (min 10 characters)"
                  className="w-full px-5 py-4 text-sm text-slate-700 focus:outline-none resize-none leading-relaxed"
                  style={{ minHeight: "160px" }} />
              ) : (
                <div className="px-5 py-4 text-sm text-slate-700 whitespace-pre-wrap min-h-[120px]">
                  {topicsCovered || <span className="text-slate-400 italic">No topics documented yet.</span>}
                </div>
              )}
            </div>

            {/* Homework */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Homework & Attachments</h3>
              </div>
              {canEdit ? (
                <textarea value={homework} onChange={e => setHomework(e.target.value)}
                  placeholder="Describe homework or practice tasks (optional)..."
                  className="w-full px-5 py-4 text-sm text-slate-700 focus:outline-none resize-none leading-relaxed"
                  style={{ minHeight: "100px" }} />
              ) : (
                <div className="px-5 py-4 text-sm text-slate-700 whitespace-pre-wrap min-h-[80px]">
                  {homework || <span className="text-slate-400 italic">No homework assigned.</span>}
                </div>
              )}

              {/* Uploaded Files Section */}
              <div className="bg-slate-50 border-t border-slate-200 p-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Submitted Files</h4>
                {files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map(f => (
                      <div key={f.fileId || f.FileId} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 text-sm cursor-pointer hover:border-violet-300 transition-colors"
                           onClick={() => window.open(f.fileUrl || f.FileUrl, "_blank")}>
                        <Paperclip className="w-4 h-4 text-violet-500 flex-shrink-0" />
                        <span className="truncate flex-1 font-medium text-slate-700">{f.originalName || f.OriginalName || "Attached File"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-2">No files submitted yet.</p>
                )}

                {/* Upload Button visible for students when session note exists */}
                {existsOnServer && !isTutor && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <input type="file" id="homework-upload" className="hidden" onChange={handleFileUpload} />
                    <label htmlFor="homework-upload" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border-2 border-dashed border-violet-300 text-violet-600 rounded-xl hover:bg-violet-50 hover:border-violet-400 transition-colors cursor-pointer text-sm font-medium">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "Uploading..." : "Submit Homework File"}
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Next Steps</h3>
              </div>
              {canEdit ? (
                <textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)}
                  placeholder="Topics for the next session or follow-up actions (optional)..."
                  className="w-full px-5 py-4 text-sm text-slate-700 focus:outline-none resize-none leading-relaxed"
                  style={{ minHeight: "100px" }} />
              ) : (
                <div className="px-5 py-4 text-sm text-slate-700 whitespace-pre-wrap min-h-[80px]">
                  {nextSteps || <span className="text-slate-400 italic">No next steps defined.</span>}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Note Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-600" /> Note Info
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-medium ${existsOnServer ? "text-emerald-600" : "text-amber-600"}`}>
                    {existsOnServer ? "Submitted" : "Not submitted"}
                  </span>
                </div>
                {noteCreatedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Submitted</span>
                    <span className="text-slate-700">{new Date(noteCreatedAt).toLocaleString()}</span>
                  </div>
                )}
                {existsOnServer && isTutor && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Edit window</span>
                    <span className={`font-medium ${isEditWindowOpen() ? "text-emerald-600" : "text-rose-500"}`}>
                      {isEditWindowOpen() ? "Open" : "Expired"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-violet-600" /> Guidelines
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li className="flex items-start gap-1.5">
                  <span className="text-violet-500 mt-0.5">•</span>
                  Topics Covered is required (min 10 chars)
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-violet-500 mt-0.5">•</span>
                  Homework and Next Steps are optional
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-violet-500 mt-0.5">•</span>
                  Only the tutor can submit/edit notes
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-violet-500 mt-0.5">•</span>
                  Editable for 24 hours after submission
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-violet-500 mt-0.5">•</span>
                  Students can view but not modify
                </li>
              </ul>
            </div>

            {/* Save Button (mobile) */}
            {isTutor && canEdit && (
              <button onClick={handleSave} disabled={saving}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${saved ? "bg-emerald-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700"} disabled:opacity-50`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : saved ? "Saved!" : existsOnServer ? "Update Notes" : "Submit Notes"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
