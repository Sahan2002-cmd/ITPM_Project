using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    /// <summary>
    /// Data-access implementation for Booking documents in the "Bookings" collection.
    ///
    /// MongoDB-level invariants enforced INSIDE this class:
    ///   1. The requested AvailabilityId MUST exist and have Status == "Free".
    ///   2. The student MUST NOT have an overlapping non-cancelled/declined booking.
    ///   3. The 2-hour cancellation window is checked here AND in the controller.
    ///
    /// All booking status transitions also update the corresponding Availability slot
    /// atomically within the same logical operation (two separate MongoDB writes — a
    /// true 2-phase transaction would require a replica set; comments mark where a
    /// session/transaction could be added).
    /// </summary>
    public class DABooking : IBooking
    {
        private readonly IMongoCollection<BookingModel>      _bookings;
        private readonly IMongoCollection<AvailabilityModel> _slots;

        public DABooking()
        {
            var ctx  = new MongoDBContext();
            _bookings = ctx.GetCollection<BookingModel>("Bookings");
            _slots    = ctx.GetCollection<AvailabilityModel>("Availability");
        }

        private static string UtcNowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // ═══════════════════════════════════════════════════════════════════════
        // 001 – CREATE BOOKING  (default Status = "Pending")
        //
        // Pre-conditions checked against MongoDB:
        //   A) AvailabilityId must exist and its Status must be exactly "Free".
        //   B) Student must have no active (Pending|Confirmed) booking that
        //      overlaps [slot.StartTime, slot.EndTime).
        // ═══════════════════════════════════════════════════════════════════════
        public Response CreateBooking(BookingRequestApi request)
        {
            try
            {
                // ── A) Verify the slot is Free ───────────────────────────────
                var slot = _slots.Find(s => s.Id == request.AvailabilityId).FirstOrDefault();
                if (slot == null)
                    return Response.Fail("The selected availability slot does not exist.");
                if (slot.Status != "Free")
                    return Response.Fail($"This slot is no longer available (current status: '{slot.Status}').");

                // ── B) Student overlap check (Pending or Confirmed bookings) ──
                var studentOverlapFilter = Builders<BookingModel>.Filter.And(
                    Builders<BookingModel>.Filter.Eq(b => b.StudentId, request.StudentId),
                    Builders<BookingModel>.Filter.In(b => b.Status, new[] { "Pending", "Confirmed" }),
                    // Overlap predicate: existing.StartTime < newEnd AND existing.EndTime > newStart
                    Builders<BookingModel>.Filter.Lt(b => b.StartTime, slot.EndTime),
                    Builders<BookingModel>.Filter.Gt(b => b.EndTime,   slot.StartTime)
                );

                if (_bookings.Find(studentOverlapFilter).Any())
                    return Response.Fail("You already have a booking that overlaps with this time slot.");

                // ── Insert the booking ───────────────────────────────────────
                var booking = new BookingModel
                {
                    BookingId      = CounterHelper.GetNextSequence("bookingId"),
                    AvailabilityId = request.AvailabilityId,
                    TutorProfileId = request.TutorProfileId,
                    TutorId        = request.TutorId,
                    StudentId      = request.StudentId,
                    Status         = "Pending",     // forced — never trust the request
                    SessionDate    = slot.StartTime.Date,
                    StartTime      = slot.StartTime,
                    EndTime        = slot.EndTime,
                    SessionType    = request.SessionType,
                    Notes          = request.Notes,
                    GroupMembers   = request.GroupMembers ?? new System.Collections.Generic.List<GroupMemberModel>(),
                    CreatedAt      = UtcNowIso(),
                    UpdatedAt      = UtcNowIso()
                };

                _bookings.InsertOne(booking);
                return Response.Success(booking, "Booking created. Awaiting tutor confirmation.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 002 – GET BY STUDENT
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetByStudent(int studentId)
        {
            try
            {
                var bookings = _bookings
                    .Find(b => b.StudentId == studentId)
                    .SortByDescending(b => b.StartTime)
                    .ToList();
                return Response.Success(bookings);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 003 – GET BY TUTOR
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetByTutor(int tutorId)
        {
            try
            {
                var bookings = _bookings
                    .Find(b => b.TutorId == tutorId)
                    .SortByDescending(b => b.StartTime)
                    .ToList();
                return Response.Success(bookings);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 004 – ACCEPT BOOKING
        // Booking → "Confirmed"  +  Slot → "Booked"
        //
        // NOTE: In production, wrap both writes in a MongoDB multi-document
        // transaction (IClientSessionHandle) for atomicity.
        // ═══════════════════════════════════════════════════════════════════════
        public Response AcceptBooking(int bookingId)
        {
            try
            {
                var booking = _bookings.Find(b => b.BookingId == bookingId).FirstOrDefault();
                if (booking == null) return Response.Fail("Booking not found.");
                if (booking.Status != "Pending")
                    return Response.Fail($"Only 'Pending' bookings can be accepted (current: '{booking.Status}').");

                // 1) Update booking status
                _bookings.UpdateOne(
                    b => b.BookingId == bookingId,
                    Builders<BookingModel>.Update
                        .Set(b => b.Status,    "Confirmed")
                        .Set(b => b.UpdatedAt, UtcNowIso()));

                // 2) Lock the availability slot
                _slots.UpdateOne(
                    s => s.Id == booking.AvailabilityId,
                    Builders<AvailabilityModel>.Update
                        .Set(s => s.Status,    "Booked")
                        .Set(s => s.UpdatedAt, UtcNowIso()));

                return Response.Success(null, "Booking confirmed and slot marked as booked.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 005 – DECLINE BOOKING
        // Booking → "Declined"  |  Slot stays "Free"
        // ═══════════════════════════════════════════════════════════════════════
        public Response DeclineBooking(int bookingId)
        {
            try
            {
                var booking = _bookings.Find(b => b.BookingId == bookingId).FirstOrDefault();
                if (booking == null) return Response.Fail("Booking not found.");
                if (booking.Status != "Pending")
                    return Response.Fail($"Only 'Pending' bookings can be declined (current: '{booking.Status}').");

                _bookings.UpdateOne(
                    b => b.BookingId == bookingId,
                    Builders<BookingModel>.Update
                        .Set(b => b.Status,    "Declined")
                        .Set(b => b.UpdatedAt, UtcNowIso()));

                // Slot intentionally left as "Free" — no slot update needed.
                return Response.Success(null, "Booking declined.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 006 – CANCEL BOOKING  (student-initiated)
        //
        // Business rule: Allowed ONLY if (booking.StartTime - UtcNow) > 2 hours.
        // This is checked here as a safety net; the controller enforces it first
        // and returns HTTP 400 so the DA never normally reaches this guard.
        //
        // On success:  Booking → "Cancelled"  +  Slot → "Free"
        // ═══════════════════════════════════════════════════════════════════════
        public Response CancelBooking(int bookingId)
        {
            try
            {
                var booking = _bookings.Find(b => b.BookingId == bookingId).FirstOrDefault();
                if (booking == null) return Response.Fail("Booking not found.");

                if (booking.Status != "Pending" && booking.Status != "Confirmed")
                    return Response.Fail($"Booking cannot be cancelled (current status: '{booking.Status}').");

                // ── 2-hour window guard (defensive duplicate of controller check) ──
                var hoursUntilSession = (booking.StartTime - DateTime.UtcNow).TotalHours;
                if (hoursUntilSession < 2)
                    return Response.Fail(
                        "Cancellation is not allowed within 2 hours of the session start time.");

                // 1) Cancel the booking
                _bookings.UpdateOne(
                    b => b.BookingId == bookingId,
                    Builders<BookingModel>.Update
                        .Set(b => b.Status,    "Cancelled")
                        .Set(b => b.UpdatedAt, UtcNowIso()));

                // 2) Restore the slot to "Free"
                _slots.UpdateOne(
                    s => s.Id == booking.AvailabilityId,
                    Builders<AvailabilityModel>.Update
                        .Set(s => s.Status,    "Free")
                        .Set(s => s.UpdatedAt, UtcNowIso()));

                return Response.Success(null, "Booking cancelled and slot restored to free.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 007 – COMPLETE BOOKING  (tutor / admin post-session)
        // ═══════════════════════════════════════════════════════════════════════
        public Response CompleteBooking(int bookingId)
        {
            try
            {
                var booking = _bookings.Find(b => b.BookingId == bookingId).FirstOrDefault();
                if (booking == null) return Response.Fail("Booking not found.");
                if (booking.Status != "Confirmed")
                    return Response.Fail($"Only 'Confirmed' bookings can be completed (current: '{booking.Status}').");

                _bookings.UpdateOne(
                    b => b.BookingId == bookingId,
                    Builders<BookingModel>.Update
                        .Set(b => b.Status,    "Completed")
                        .Set(b => b.UpdatedAt, UtcNowIso()));

                return Response.Success(null, "Booking marked as completed.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}
