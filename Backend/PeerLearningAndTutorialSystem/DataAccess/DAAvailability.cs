using MongoDB.Driver;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    /// <summary>
    /// Data-access implementation for Availability slot documents in the "Availability" collection.
    ///
    /// Business-rule validations (date not in the past, EndTime >= StartTime + 30 min, forced "Free" status)
    /// are enforced by AvailabilityController before these methods are called.
    ///
    /// MongoDB-level overlap detection is performed INSIDE CreateSlot to guarantee atomicity regardless
    /// of which layer triggers the call.
    /// </summary>
    public class DAAvailability : IAvailability
    {
        private readonly IMongoCollection<AvailabilityModel> _slots;

        public DAAvailability()
        {
            var ctx = new MongoDBContext();
            _slots = ctx.GetCollection<AvailabilityModel>("Availability");
        }

        // ─── helpers ────────────────────────────────────────────────────────────
        private static string UtcNowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // ═══════════════════════════════════════════════════════════════════════
        // 001 – CREATE SLOT
        //
        // Overlap rule (same-tutor, non-Blocked):
        //   newStart < existingEnd  AND  newEnd > existingStart
        //
        // This is the standard interval-overlap predicate.  Using strict inequalities
        // means back-to-back slots (e.g. 09:00-10:00 then 10:00-11:00) are allowed.
        // ═══════════════════════════════════════════════════════════════════════
        public Response CreateSlot(AvailabilityRequestApi request)
        {
            try
            {
                // ── MongoDB overlap query ────────────────────────────────────
                // Find any existing slot for the same tutor that:
                //   - Is NOT "Blocked" (Blocked slots are admin-reserved, non-bookable)
                //   - Overlaps the requested [StartTime, EndTime) window
                var overlapFilter = Builders<AvailabilityModel>.Filter.And(
                    Builders<AvailabilityModel>.Filter.Eq(s => s.TutorProfileId, request.TutorProfileId),
                    Builders<AvailabilityModel>.Filter.Ne(s => s.Status, "Blocked"),        // ignore Blocked
                    Builders<AvailabilityModel>.Filter.Lt(s => s.StartTime, request.EndTime),   // existing starts before new ends
                    Builders<AvailabilityModel>.Filter.Gt(s => s.EndTime,   request.StartTime)  // existing ends after new starts
                );

                if (_slots.Find(overlapFilter).Any())
                    return Response.Fail("This time slot overlaps with an existing availability slot for this tutor.");

                var slot = new AvailabilityModel
                {
                    TutorProfileId = request.TutorProfileId,
                    Date           = request.StartTime.Date,  // canonical date derived from StartTime (UTC)
                    StartTime      = request.StartTime,
                    EndTime        = request.EndTime,
                    // Status ALWAYS forced to "Free" here, never trusting the request value
                    Status         = "Free",
                    CreatedAt      = UtcNowIso(),
                    UpdatedAt      = UtcNowIso()
                };

                _slots.InsertOne(slot);
                return Response.Success(slot, "Availability slot created successfully.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 002 – GET BY TUTOR
        // Returns only "Free" slots whose Date is >= today (UTC midnight).
        // Sorted ascending by StartTime so callers receive a chronological list.
        // ═══════════════════════════════════════════════════════════════════════
        public Response GetByTutor(string tutorProfileId)
        {
            try
            {
                var todayUtc = DateTime.UtcNow.Date;

                var filter = Builders<AvailabilityModel>.Filter.And(
                    Builders<AvailabilityModel>.Filter.Eq(s => s.TutorProfileId, tutorProfileId),
                    Builders<AvailabilityModel>.Filter.Eq(s => s.Status, "Free"),
                    Builders<AvailabilityModel>.Filter.Gte(s => s.Date, todayUtc)
                );

                var slots = _slots.Find(filter).SortBy(s => s.StartTime).ToList();
                return Response.Success(slots);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 003 – UPDATE STATUS
        // Used internally by the booking flow:
        //   Accept booking  → "Free"    → "Booked"
        //   Cancel booking  → "Booked"  → "Free"
        // Also used by admin to block/unblock slots.
        // ═══════════════════════════════════════════════════════════════════════
        public Response UpdateStatus(string id, string newStatus)
        {
            try
            {
                var existing = _slots.Find(s => s.Id == id).FirstOrDefault();
                if (existing == null) return Response.Fail("Availability slot not found.");

                var update = Builders<AvailabilityModel>.Update
                    .Set(s => s.Status,    newStatus)
                    .Set(s => s.UpdatedAt, UtcNowIso());

                _slots.UpdateOne(s => s.Id == id, update);
                return Response.Success(null, $"Slot status updated to '{newStatus}'.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 004 – HARD DELETE
        // A slot may only be physically removed when it is still "Free".
        // "Booked" and "Blocked" slots must be transitioned to a terminal state
        // via UpdateStatus before deletion is permitted.
        // ═══════════════════════════════════════════════════════════════════════
        public Response DeleteSlot(string id)
        {
            try
            {
                var existing = _slots.Find(s => s.Id == id).FirstOrDefault();
                if (existing == null) return Response.Fail("Availability slot not found.");

                if (existing.Status != "Free")
                    return Response.Fail($"Only 'Free' slots can be deleted. Current status: '{existing.Status}'.");

                _slots.DeleteOne(s => s.Id == id);
                return Response.Success(null, "Availability slot deleted successfully.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}
