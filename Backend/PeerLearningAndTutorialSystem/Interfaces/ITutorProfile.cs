using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    public interface ITutorProfile
    {
        /// <summary>Persist a new tutor profile. Status is forced to "Pending Verification" by the caller.</summary>
        Response CreateProfile(TutorProfileRequestApi request);

        /// <summary>Returns all profiles with Status == "Active".</summary>
        Response GetAllActiveVerified();

        /// <summary>Returns a single tutor profile by its ObjectId.</summary>
        Response GetById(string id);

        /// <summary>Returns a single tutor profile by the user's integer UserId.</summary>
        Response GetByUserId(int userId);

        /// <summary>Partial update of mutable fields (Bio, Subjects, HourlyRate, etc.).</summary>
        Response UpdateProfile(string id, TutorProfileRequestApi request);

        /// <summary>Soft-delete: sets Status to "Inactive" or "Suspended".</summary>
        Response SoftDelete(string id, string newStatus);
    }
}
