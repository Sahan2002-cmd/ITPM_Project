using MongoDB.Driver;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;

namespace PeerLearningAndTutorialSystem.BusinessLayer
{
    public static class CounterHelper
    {
        private static readonly MongoDBContext _context = new MongoDBContext();
        private static readonly IMongoCollection<Counter> _counters;

        static CounterHelper()
        {
            _counters = _context.GetCollection<Counter>("Counters");
            // Ensure counters exist for all collections
            EnsureCounter("userId");
            EnsureCounter("bookingId");
            EnsureCounter("notificationId");
            EnsureCounter("fileId");
            EnsureCounter("messageId");
            EnsureCounter("outMessageId");
            EnsureCounter("noteId");
            EnsureCounter("ratingId");
            EnsureCounter("evaluationId");
        }

        private static void EnsureCounter(string id)
        {
            var filter = Builders<Counter>.Filter.Eq(c => c.Id, id);
            if (!_counters.Find(filter).Any())
            {
                _counters.InsertOne(new Counter { Id = id, Seq = 0 });
            }
        }

        public static int GetNextSequence(string counterId)
        {
            var filter = Builders<Counter>.Filter.Eq(c => c.Id, counterId);
            var update = Builders<Counter>.Update.Inc(c => c.Seq, 1);
            var options = new FindOneAndUpdateOptions<Counter>
            {
                ReturnDocument = ReturnDocument.After,
                IsUpsert = true
            };
            var result = _counters.FindOneAndUpdate(filter, update, options);
            return result.Seq;
        }
    }

    public class Counter
    {
        public string Id { get; set; }
        public int Seq { get; set; }
    }
}