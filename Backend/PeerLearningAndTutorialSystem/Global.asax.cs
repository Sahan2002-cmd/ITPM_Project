using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using PeerLearningAndTutorialSystem.Models;
using System;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace PeerLearningAndTutorialSystem
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            // Test MongoDB connection once
            try
            {
                var mongoClient = new MongoClient(System.Configuration.ConfigurationManager.AppSettings["MongoDBConnection"]);
                var database = mongoClient.GetDatabase("PeerLearningDB");
                var collectionNames = database.ListCollectionNames().ToList();
                System.Diagnostics.Debug.WriteLine("MongoDB connected. Collections: " + string.Join(", ", collectionNames));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("MongoDB connection failed: " + ex.Message);
            }

            // Register MVC, Web API, etc.
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            GlobalConfiguration.Configure(WebApiConfig.Register);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            UnityConfig.RegisterComponents();

            // Register MongoDB serializers and class maps
            BsonSerializer.RegisterSerializer(typeof(DateTime), new DateTimeSerializer(DateTimeKind.Utc, BsonType.DateTime));

            BsonClassMap.RegisterClassMap<UserModel>(cm =>
            {
                cm.AutoMap();
                cm.SetIdMember(cm.GetMemberMap(c => c.UserId));
                cm.GetMemberMap(c => c.UserId).SetSerializer(new Int32Serializer(BsonType.Int32));
                cm.GetMemberMap(c => c.CreatedAt).SetSerializer(new StringSerializer(BsonType.String));
                cm.GetMemberMap(c => c.UpdatedAt).SetSerializer(new StringSerializer(BsonType.String));
            });

            BsonClassMap.RegisterClassMap<FileResourceModel>(cm =>
            {
                cm.AutoMap();
                cm.SetIdMember(cm.GetMemberMap(c => c.FileId));
                cm.GetMemberMap(c => c.FileId).SetSerializer(new Int32Serializer(BsonType.Int32));
                cm.GetMemberMap(c => c.CreatedAt).SetSerializer(new StringSerializer(BsonType.String));
                cm.GetMemberMap(c => c.UpdatedAt).SetSerializer(new StringSerializer(BsonType.String));
            });

            BsonClassMap.RegisterClassMap<InSessionMessageModel>(cm =>
            {
                cm.AutoMap();
                cm.SetIdMember(cm.GetMemberMap(c => c.MessageId));
                cm.GetMemberMap(c => c.MessageId).SetSerializer(new Int32Serializer(BsonType.Int32));
                cm.GetMemberMap(c => c.CreatedAt).SetSerializer(new StringSerializer(BsonType.String));
                cm.GetMemberMap(c => c.UpdatedAt).SetSerializer(new StringSerializer(BsonType.String));
            });

            BsonClassMap.RegisterClassMap<OutSessionMessageModel>(cm =>
            {
                cm.AutoMap();
                cm.SetIdMember(cm.GetMemberMap(c => c.OutMessageId));
                cm.GetMemberMap(c => c.OutMessageId).SetSerializer(new Int32Serializer(BsonType.Int32));
                cm.GetMemberMap(c => c.CreatedAt).SetSerializer(new StringSerializer(BsonType.String));
                cm.GetMemberMap(c => c.UpdatedAt).SetSerializer(new StringSerializer(BsonType.String));
            });

            BsonClassMap.RegisterClassMap<SessionNoteModel>(cm =>
            {
                cm.AutoMap();
                cm.SetIdMember(cm.GetMemberMap(c => c.NoteId));
                cm.GetMemberMap(c => c.NoteId).SetSerializer(new Int32Serializer(BsonType.Int32));
                cm.GetMemberMap(c => c.CreatedAt).SetSerializer(new StringSerializer(BsonType.String));
                cm.GetMemberMap(c => c.UpdatedAt).SetSerializer(new StringSerializer(BsonType.String));
            });

            BsonClassMap.RegisterClassMap<BookingModel>(cm =>
            {
                cm.AutoMap();
                cm.SetIdMember(cm.GetMemberMap(c => c.BookingId));
                cm.GetMemberMap(c => c.BookingId).SetSerializer(new Int32Serializer(BsonType.Int32));
            });

            // Module 4 — Rating & Analytics
            BsonClassMap.RegisterClassMap<RatingModel>(cm =>
            {
                cm.AutoMap();
                cm.SetIdMember(cm.GetMemberMap(c => c.RatingId));
                cm.GetMemberMap(c => c.RatingId).SetSerializer(new Int32Serializer(BsonType.Int32));
                cm.GetMemberMap(c => c.CreatedAt).SetSerializer(new StringSerializer(BsonType.String));
                cm.GetMemberMap(c => c.UpdatedAt).SetSerializer(new StringSerializer(BsonType.String));
            });

            BsonClassMap.RegisterClassMap<StudentEvaluationModel>(cm =>
            {
                cm.AutoMap();
                cm.SetIdMember(cm.GetMemberMap(c => c.EvaluationId));
                cm.GetMemberMap(c => c.EvaluationId).SetSerializer(new Int32Serializer(BsonType.Int32));
                cm.GetMemberMap(c => c.CreatedAt).SetSerializer(new StringSerializer(BsonType.String));
                cm.GetMemberMap(c => c.UpdatedAt).SetSerializer(new StringSerializer(BsonType.String));
            });

            // Seed Module 1 (TutorProfile + Availability) and Module 2 (Booking + Notifications)
            // Runs only when the Users collection is empty — safe on every app start
            SeedData.RunIfEmpty();
        }
    }
}