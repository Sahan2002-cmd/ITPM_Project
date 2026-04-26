using MongoDB.Driver;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    public class DARecording
    {
        private readonly IMongoCollection<RecordingModel> _recordings;
        private readonly IMongoCollection<BookingModel> _bookings;

        public DARecording()
        {
            var ctx = new MongoDBContext();
            _recordings = ctx.GetCollection<RecordingModel>("Recordings");
            _bookings = ctx.GetCollection<BookingModel>("Bookings");
        }

        public Response SaveRecording(RecordingModel model)
        {
            try
            {
                model.Id = Guid.NewGuid().ToString();
                model.CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                _recordings.InsertOne(model);
                return Response.Success(model, "Recording saved successfully.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        public Response GetRecordingsByStudent(int studentId)
        {
            try
            {
                // Find all bookings for this student
                var bookingIds = _bookings.Find(b => b.StudentId == studentId)
                                         .ToList()
                                         .Select(b => b.BookingId)
                                         .ToList();

                if (!bookingIds.Any()) return Response.Success(new List<RecordingModel>(), "No bookings found for student.");

                // Find recordings linked to those bookings
                var recordings = _recordings.Find(r => bookingIds.Contains(r.BookingId)).ToList();
                return Response.Success(recordings);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        public Response GetRecordingById(string id)
        {
            try
            {
                var recording = _recordings.Find(r => r.Id == id).FirstOrDefault();
                if (recording == null) return Response.Fail("Recording not found.");
                return Response.Success(recording);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }
    }
}
