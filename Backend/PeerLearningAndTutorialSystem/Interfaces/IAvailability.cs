using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    public interface IAvailability
    {
        /// <summary>
        /// Create a new availability slot. Performs MongoDB-level overlap check before insert.
        /// Status is forced to "Free" by the caller.
        /// </summary>
        Response CreateSlot(AvailabilityRequestApi request);

        /// <summary>Returns all "Free" slots for a tutor whose Date >= today (UTC).</summary>
        Response GetByTutor(string tutorProfileId);

        /// <summary>Update the status of a slot (e.g., "Free" → "Booked" or back).</summary>
        Response UpdateStatus(string id, string newStatus);

        /// <summary>Hard-delete a slot. Allowed only when Status == "Free".</summary>
        Response DeleteSlot(string id);
    }
}
