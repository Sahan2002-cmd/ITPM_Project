using MongoDB.Driver;
using System.Configuration;

namespace PeerLearningAndTutorialSystem.DatabaseConnectivity
{
    public class MongoDBContext
    {
        private readonly IMongoDatabase _database;

        public MongoDBContext()
        {
            var connectionString = ConfigurationManager.AppSettings["MongoDBConnection"];
            var databaseName = ConfigurationManager.AppSettings["MongoDBDatabase"];
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<T> GetCollection<T>(string collectionName)
        {
            return _database.GetCollection<T>(collectionName);
        }

        // Optional: expose the database for admin operations
        public IMongoDatabase GetDatabase() => _database;
    
}
}