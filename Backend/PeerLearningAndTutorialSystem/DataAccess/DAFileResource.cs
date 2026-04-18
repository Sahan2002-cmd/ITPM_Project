using MongoDB.Driver;
using PeerLearningAndTutorialSystem.BusinessLayer;
using PeerLearningAndTutorialSystem.DatabaseConnectivity;
using PeerLearningAndTutorialSystem.Interfaces;
using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;
using System;
using System.Collections.Generic;
using System.IO;

namespace PeerLearningAndTutorialSystem.DataAccess
{
    public class DAFileResource : IFileResource
    {
        private readonly IMongoCollection<FileResourceModel> _files;
        private readonly IMongoCollection<BookingModel> _bookings;

        public DAFileResource()
        {
            var ctx = new MongoDBContext();
            _files = ctx.GetCollection<FileResourceModel>("FileResources");
            _bookings = ctx.GetCollection<BookingModel>("Bookings");
        }

        private string NowIso() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        // 001 – GET SESSION FILES (non‑deleted)
        public Response GetSessionFiles(int bookingId)
        {
            try
            {
                var list = _files.Find(f => f.BookingId == bookingId && !f.IsDeleted).ToList();
                return Response.Success(list);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 001b – GET FILE BY ID (for download)
        public Response GetFileById(int fileId)
        {
            try
            {
                var file = _files.Find(f => f.FileId == fileId && !f.IsDeleted).FirstOrDefault();
                if (file == null) return Response.Fail("File not found.");
                return Response.Success(file);
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 002 – UPLOAD FILE METADATA (physical file saved by controller)
        public Response UploadFile(FileResourceRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FileName) || string.IsNullOrWhiteSpace(request.FilePath))
                    return Response.Fail("File name and path are required.");

                if (request.FileName.Trim().Length > 100)
                    return Response.Fail("File name cannot exceed 100 characters.");

                var file = new FileResourceModel
                {
                    FileId = CounterHelper.GetNextSequence("fileId"),
                    BookingId = request.BookingId.Value,
                    UploadedBy = request.UploadedBy.Value,
                    FileName = request.FileName.Trim(),
                    FilePath = request.FilePath.Trim(),
                    FileSize = request.FileSize.Value,
                    FileType = request.FileType.ToLower(),
                    IsDeleted = false,
                    CreatedBy = request.UploadedBy,
                    CreatedAt = NowIso(),
                    UpdatedBy = null,
                    UpdatedAt = null
                };
                _files.InsertOne(file);
                return Response.Success(null, "File uploaded successfully.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 003 – RENAME FILE (uploader only)
        public Response RenameFile(FileResourceRequestApi request, int callerId)
        {
            try
            {
                var file = _files.Find(f => f.FileId == request.FileId).FirstOrDefault();
                if (file == null) return Response.Fail("File not found.");
                if (file.UploadedBy != callerId) return Response.Fail("You can only rename files you uploaded.");

                if (string.IsNullOrWhiteSpace(request.FileName))
                    return Response.Fail("File name is required.");
                if (request.FileName.Trim().Length > 100)
                    return Response.Fail("File name cannot exceed 100 characters.");

                _files.UpdateOne(f => f.FileId == request.FileId,
                    Builders<FileResourceModel>.Update
                        .Set(f => f.FileName, request.FileName.Trim())
                        .Set(f => f.UpdatedAt, NowIso())
                        .Set(f => f.UpdatedBy, callerId));

                return Response.Success(null, "File renamed.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 004 – DELETE FILE (uploader or tutor — hard delete: removes record + physical file)
        public Response DeleteFile(int fileId, int callerId)
        {
            try
            {
                var file = _files.Find(f => f.FileId == fileId).FirstOrDefault();
                if (file == null) return Response.Fail("File not found.");

                // Allow delete if caller is the uploader
                bool isUploader = file.UploadedBy == callerId;

                // Allow delete if caller is the tutor of this session
                bool isTutor = false;
                if (!isUploader)
                {
                    var booking = _bookings.Find(b => b.BookingId == file.BookingId).FirstOrDefault();
                    isTutor = booking != null && booking.TutorId == callerId;
                }

                if (!isUploader && !isTutor)
                    return Response.Fail("Only the uploader or the session tutor can delete this file.");

                // Hard delete: remove physical file from disk
                try
                {
                    string physicalPath = System.Web.Hosting.HostingEnvironment.MapPath("~" + file.FilePath);
                    if (!string.IsNullOrEmpty(physicalPath) && File.Exists(physicalPath))
                        File.Delete(physicalPath);
                }
                catch { /* physical file removal is best-effort */ }

                // Hard delete: remove record from MongoDB
                _files.DeleteOne(f => f.FileId == fileId);

                return Response.Success(null, "File deleted.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        public Response GetAllFiles()
        {
            var all = _files.Find(f => !f.IsDeleted).ToList();
            return Response.Success(all);
        }
    }
}