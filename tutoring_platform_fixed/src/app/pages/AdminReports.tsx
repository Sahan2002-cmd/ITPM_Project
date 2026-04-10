// src/pages/AdminReports.tsx
import { useState } from 'react';
import { Download, FileText, Users, BookOpen, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadStudentsReportPdf, downloadTutorsReportPdf, downloadSessionNotesPdf } from '../services/Module_03_API';

type ReportType = 'students' | 'tutors' | 'sessionnotes';

export default function AdminReports() {
  const [downloading, setDownloading] = useState<ReportType | null>(null);

  const handleDownload = async (type: ReportType, filename: string, downloadFn: () => Promise<Blob>) => {
    setDownloading(type);
    try {
      const blob = await downloadFn();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      type: 'students' as ReportType,
      title: 'Students Report',
      description: 'List of all registered students with details',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      filename: `students_report_${new Date().toISOString().slice(0, 10)}.pdf`,
      downloadFn: downloadStudentsReportPdf,
    },
    {
      type: 'tutors' as ReportType,
      title: 'Tutors Report',
      description: 'List of all tutors with subjects and ratings',
      icon: Users,
      color: 'bg-emerald-100 text-emerald-700',
      filename: `tutors_report_${new Date().toISOString().slice(0, 10)}.pdf`,
      downloadFn: downloadTutorsReportPdf,
    },
    {
      type: 'sessionnotes' as ReportType,
      title: 'Session Notes Report',
      description: 'All session notes submitted by tutors',
      icon: BookOpen,
      color: 'bg-violet-100 text-violet-700',
      filename: `session_notes_report_${new Date().toISOString().slice(0, 10)}.pdf`,
      downloadFn: downloadSessionNotesPdf,
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-slate-500 dark:text-slate-400">Download platform reports as PDF</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.type}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${report.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{report.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{report.description}</p>
              <button
                onClick={() => handleDownload(report.type, report.filename, report.downloadFn)}
                disabled={downloading === report.type}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {downloading === report.type ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-4 h-4" /> Download PDF</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Additional reports (if needed) */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Other Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => toast.info('Coming soon')}
            className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700">In‑Session Messages</p>
              <p className="text-xs text-slate-400">Export all chat logs</p>
            </div>
          </button>
          <button
            onClick={() => toast.info('Coming soon')}
            className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-5 h-5 text-emerald-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700">Out‑Session Messages</p>
              <p className="text-xs text-slate-400">Export message threads</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}