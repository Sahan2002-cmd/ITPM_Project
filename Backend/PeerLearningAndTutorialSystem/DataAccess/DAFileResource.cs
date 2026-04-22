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
    public class DAFileResource : IFileResource
    {
        private readonly IMongoCollection<FileResourceModel> _files;

        public DAFileResource()
        {
            var ctx = new MongoDBContext();
            _files = ctx.GetCollection<FileResourceModel>("FileResources");
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

        // 002 – UPLOAD FILE METADATA (physical file saved by controller)
        public Response UploadFile(FileResourceRequestApi request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FileName) || string.IsNullOrWhiteSpace(request.FilePath))
                    return Response.Fail("File name and path are required.");

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

                _files.UpdateOne(f => f.FileId == request.FileId,
                    Builders<FileResourceModel>.Update
                        .Set(f => f.FileName, request.FileName.Trim())
                        .Set(f => f.UpdatedAt, NowIso())
                        .Set(f => f.UpdatedBy, callerId));

                return Response.Success(null, "File renamed.");
            }
            catch (Exception ex) { return Response.Error(ex.Message); }
        }

        // 004 – DELETE FILE (uploader or tutor)
        public Response DeleteFile(int fileId, int callerId)
        {
            try
            {
                var file = _files.Find(f => f.FileId == fileId).FirstOrDefault();
                if (file == null) return Response.Fail("File not found.");

                // For simplicity we check uploader; you could also check tutor via Bookings collection
                if (file.UploadedBy != callerId)
                    return Response.Fail("You can only delete files you uploaded.");

                _files.UpdateOne(f => f.FileId == fileId,
                    Builders<FileResourceModel>.Update
                        .Set(f => f.IsDeleted, true)
                        .Set(f => f.UpdatedAt, NowIso())
                        .Set(f => f.UpdatedBy, callerId));

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