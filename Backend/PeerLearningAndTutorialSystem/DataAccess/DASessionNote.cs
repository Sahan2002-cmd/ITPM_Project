using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    public class DASessionNote : ISessionNote
    {
        private readonly IMongoCollection<SessionNoteModel> _notes;
        private readonly IMongoCollection<BookingModel> _bookings;

        public DASessionNote()
        {
            var ctx = new MongoDBContext();
            _notes = ctx.GetCollection<SessionNoteModel>("SessionNotes");
            _bookings = ctx.GetCollection<BookingModel>("Bookings");
        }

        private string NowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // 001 – GET NOTE BY BOOKING (student only after Completed)
        public Response GetNoteByBooking(int bookingId)
        {
            try
            {
                var note = _notes.Find(n => n.BookingId == bookingId && !n.IsDeleted).FirstOrDefault();
                if (note == null) return Response.Success(null, "No note submitted yet.");

                // Optionally check session status if caller is student – but controller already restricts
                return Response.Success(note);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 002 – SUBMIT NOTE (tutor only, session Completed, within 24h)
        public Response SubmitNote(SessionNoteRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.TopicsCovered))
                    return Response.Fail("Topics covered is required.");
                if (request.TopicsCovered.Trim().Length < 10)
                    return Response.Fail("Topics covered must be at least 10 characters.");

                var booking = _bookings.Find(b => b.BookingId == request.BookingId).FirstOrDefault();
                if (booking == null) return Response.Fail("Booking not found.");
                if (booking.Status != "Completed") return Response.Fail("Session must be Completed before submitting a note.");
                if ((DateTime.UtcNow - booking.SessionDate).TotalHours > 24)
                    return Response.Fail("Note must be submitted within 24 hours of session end.");

                var existing = _notes.Find(n => n.BookingId == request.BookingId).FirstOrDefault();
                if (existing != null) return Response.Fail("A note already exists for this session.");

                var note = new SessionNoteModel
                {
                    NoteId = CounterHelper.GetNextSequence("noteId"),
                    BookingId = request.BookingId.Value,
                    TutorId = request.TutorId.Value,
                    TopicsCovered = request.TopicsCovered.Trim(),
                    Homework = request.Homework?.Trim(),
                    NextSteps = request.NextSteps?.Trim(),
                    IsDeleted = false,
                    AdminDeleteReason = null,
                    CreatedBy = request.TutorId,
                    CreatedAt = NowIso(),
                    UpdatedBy = null,
                    UpdatedAt = null
                };
                _notes.InsertOne(note);
                return Response.Success(null, "Session note submitted.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 003 – EDIT NOTE (tutor only, within 24h of submission)
        public Response EditNote(SessionNoteRequestApi request, int tutorId)
        {
            try
            {
                var note = _notes.Find(n => n.NoteId == request.NoteId).FirstOrDefault();
                if (note == null) return Response.Fail("Note not found.");
                if (note.TutorId != tutorId) return Response.Fail("You can only edit your own notes.");

                var submitted = DateTime.Parse(note.CreatedAt);
                if ((DateTime.UtcNow - submitted).TotalHours > 24)
                    return Response.Fail("Note can only be edited within 24 hours of submission.");

                var updates = new List<UpdateDefinition<SessionNoteModel>>();
                if (!string.IsNullOrWhiteSpace(request.TopicsCovered))
                {
                    if (request.TopicsCovered.Trim().Length < 10)
                        return Response.Fail("Topics covered must be at least 10 characters.");
                    updates.Add(Builders<SessionNoteModel>.Update.Set(n => n.TopicsCovered, request.TopicsCovered.Trim()));
                }
                if (request.Homework != null)
                    updates.Add(Builders<SessionNoteModel>.Update.Set(n => n.Homework, request.Homework.Trim()));
                if (request.NextSteps != null)
                    updates.Add(Builders<SessionNoteModel>.Update.Set(n => n.NextSteps, request.NextSteps.Trim()));

                if (updates.Count == 0) return Response.Fail("No fields to update.");

                updates.Add(Builders<SessionNoteModel>.Update.Set(n => n.UpdatedAt, NowIso()));
                updates.Add(Builders<SessionNoteModel>.Update.Set(n => n.UpdatedBy, tutorId));

                _notes.UpdateOne(n => n.NoteId == request.NoteId, Builders<SessionNoteModel>.Update.Combine(updates));
                return Response.Success(null, "Note updated.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 004 – ADMIN SOFT DELETE
        public Response AdminDeleteNote(SessionNoteRequestApi request, int adminId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.AdminDeleteReason))
                    return Response.Fail("Deletion reason is required.");

                _notes.UpdateOne(n => n.NoteId == request.NoteId,
                    Builders<SessionNoteModel>.Update
                        .Set(n => n.IsDeleted, true)
                        .Set(n => n.AdminDeleteReason, request.AdminDeleteReason.Trim())
                        .Set(n => n.UpdatedAt, NowIso())
                        .Set(n => n.UpdatedBy, adminId));

                return Response.Success(null, "Note deleted by admin.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 005 – GET ALL NOTES FOR ADMIN REPORT
        public Response GetAllNotesReport(int adminId)
        {
            try
            {
                var notes = _notes.Find(n => !n.IsDeleted).ToList();
                // Enrich with tutor names (optional – you can add lookup in controller)
                return Response.Success(notes);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}