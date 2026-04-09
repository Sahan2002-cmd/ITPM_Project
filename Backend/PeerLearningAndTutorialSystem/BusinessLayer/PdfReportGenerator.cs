using iTextSharp.text;
using iTextSharp.text.pdf;
using PeerLearningAndTutorialSystem.Models;
using System;
using System.Collections.Generic;
using System.IO;

// Explicit aliases — resolves CS0104 ambiguity with System.Drawing
using PdfFont = iTextSharp.text.Font;
using PdfRectangle = iTextSharp.text.Rectangle;
using PdfDocument = iTextSharp.text.Document;

namespace PeerLearningAndTutorialSystem.BusinessLayer
{
    public static class PdfReportGenerator
    {
        // ── Colors ────────────────────────────────────────────────────────
        private static readonly BaseColor _headerBg = new BaseColor(31, 78, 121);
        private static readonly BaseColor _rowAlt = new BaseColor(214, 228, 240);
        private static readonly BaseColor _white = BaseColor.WHITE;
        private static readonly BaseColor _textDark = new BaseColor(44, 44, 44);
        private static readonly BaseColor _muted = new BaseColor(150, 150, 150);
        private static readonly BaseColor _subGray = new BaseColor(85, 85, 85);

        // ── Fonts — use PdfFont alias (not System.Drawing.Font) ───────────
        private static readonly PdfFont _titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18f, _headerBg);
        private static readonly PdfFont _subFont = FontFactory.GetFont(FontFactory.HELVETICA, 10f, _subGray);
        private static readonly PdfFont _headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10f, _white);
        private static readonly PdfFont _cellFont = FontFactory.GetFont(FontFactory.HELVETICA, 9f, _textDark);
        private static readonly PdfFont _footerFont = FontFactory.GetFont(FontFactory.HELVETICA_OBLIQUE, 8f, _muted);

        // ════════════════════════════════════════════════════════════════
        //  SESSION NOTES REPORT
        //  Called by SessionNoteController.DownloadReport()
        //  Returns PDF as byte[]
        // ════════════════════════════════════════════════════════════════
        public static byte[] GenerateSessionNotesReport(List<SessionNoteModel> notes)
        {
            using (var ms = new MemoryStream())
            {
                // PdfDocument alias avoids ambiguity with System.Drawing
                var doc = new PdfDocument(PageSize.A4.Rotate(), 30f, 30f, 40f, 40f);
                PdfWriter.GetInstance(doc, ms);
                doc.Open();

                // Title block
                doc.Add(new Paragraph("Peer Learning & Tutoring System", _titleFont)
                { SpacingAfter = 4f });
                doc.Add(new Paragraph(
                    $"Session Notes Report   |   Generated: {DateTime.Now:dd MMM yyyy  HH:mm}",
                    _subFont)
                { SpacingAfter = 2f });
                doc.Add(new Paragraph(
                    $"Total Records: {notes.Count}",
                    _subFont)
                { SpacingAfter = 14f });

                // Table — 6 columns
                var table = new PdfPTable(6) { WidthPercentage = 100f };

                // Fix CS1503: explicit float[] literals — not int or string
                table.SetWidths(new float[] { 15f, 14f, 28f, 17f, 17f, 9f });

                AddHeaderCell(table, "Tutor");
                AddHeaderCell(table, "Subject");
                AddHeaderCell(table, "Topics Covered");
                AddHeaderCell(table, "Homework");
                AddHeaderCell(table, "Next Steps");
                AddHeaderCell(table, "Submitted At");

                for (int i = 0; i < notes.Count; i++)
                {
                    var note = notes[i];
                    bool shade = (i % 2 == 1);

                    AddDataCell(table, note.TutorName ?? "-", shade);
                    AddDataCell(table, "-", shade);
                    AddDataCell(table, note.TopicsCovered ?? "-", shade);
                    AddDataCell(table,
                        string.IsNullOrWhiteSpace(note.Homework) ? "-" : note.Homework, shade);
                    AddDataCell(table,
                        string.IsNullOrWhiteSpace(note.NextSteps) ? "-" : note.NextSteps, shade);
                    AddDataCell(table, note.CreatedAt ?? "-", shade);
                }

                doc.Add(table);

                doc.Add(new Paragraph(
                    "\nThis report is confidential and intended for Admin use only.",
                    _footerFont)
                { SpacingBefore = 10f });

                doc.Close();
                return ms.ToArray();
            }
        }

        // ════════════════════════════════════════════════════════════════
        //  USERS REPORT  (Admin)
        // ════════════════════════════════════════════════════════════════
        public static byte[] GenerateUsersReport(List<UserModel> users)
        {
            using (var ms = new MemoryStream())
            {
                var doc = new PdfDocument(PageSize.A4, 30f, 30f, 40f, 40f);
                PdfWriter.GetInstance(doc, ms);
                doc.Open();

                doc.Add(new Paragraph("Peer Learning & Tutoring System", _titleFont)
                { SpacingAfter = 4f });
                doc.Add(new Paragraph(
                    $"Users Report   |   Generated: {DateTime.Now:dd MMM yyyy  HH:mm}",
                    _subFont)
                { SpacingAfter = 2f });
                doc.Add(new Paragraph(
                    $"Total Records: {users.Count}",
                    _subFont)
                { SpacingAfter = 14f });

                var table = new PdfPTable(5) { WidthPercentage = 100f };
                table.SetWidths(new float[] { 25f, 30f, 15f, 15f, 15f });

                AddHeaderCell(table, "Full Name");
                AddHeaderCell(table, "Email");
                AddHeaderCell(table, "Role");
                AddHeaderCell(table, "Status");
                AddHeaderCell(table, "Created At");

                for (int i = 0; i < users.Count; i++)
                {
                    var u = users[i];
                    bool shade = (i % 2 == 1);
                    AddDataCell(table, u.FullName ?? "-", shade);
                    AddDataCell(table, u.Email ?? "-", shade);
                    AddDataCell(table, u.RoleName ?? "-", shade);
                    AddDataCell(table, u.Status ?? "-", shade);
                    AddDataCell(table, u.CreatedAt ?? "-", shade);
                }

                doc.Add(table);
                doc.Close();
                return ms.ToArray();
            }
        }

        // ── Helpers ───────────────────────────────────────────────────────

        private static void AddHeaderCell(PdfPTable table, string text)
        {
            var cell = new PdfPCell(new Phrase(text, _headerFont))
            {
                BackgroundColor = _headerBg,
                Padding = 7f,
                Border = PdfRectangle.NO_BORDER,     // alias fixes CS0104
                HorizontalAlignment = Element.ALIGN_LEFT
            };
            table.AddCell(cell);
        }

        private static void AddDataCell(PdfPTable table, string text, bool shaded)
        {
            var cell = new PdfPCell(new Phrase(text, _cellFont))
            {
                BackgroundColor = shaded ? _rowAlt : _white,
                Padding = 6f,
                Border = PdfRectangle.BOTTOM_BORDER, // alias fixes CS0104
                BorderColor = new BaseColor(220, 220, 220),
                BorderWidth = 0.5f,
                HorizontalAlignment = Element.ALIGN_LEFT
            };
            table.AddCell(cell);
        }
    }
}