using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    public interface IBooking
    {
        /// <summary>
        /// Create a new booking. Validates the availability slot is "Free" and that
        /// the student has no overlapping confirmed booking.
        /// </summary>
        Response CreateBooking(BookingRequestApi request);

        /// <summary>Returns all bookings for a given student (by UserId).</summary>
        Response GetByStudent(int studentId);

        /// <summary>Returns all bookings for a given tutor (by UserId).</summary>
        Response GetByTutor(int tutorId);

        /// <summary>Accept a booking: status → "Confirmed" and marks the slot as "Booked".</summary>
        Response AcceptBooking(int bookingId);

        /// <summary>Decline a booking: status → "Declined", slot stays "Free".</summary>
        Response DeclineBooking(int bookingId);

        /// <summary>
        /// Cancel a booking. Business rule: allowed only when
        /// (session StartTime − UtcNow) > 2 hours. Slot reverts to "Free".
        /// </summary>
        Response CancelBooking(int bookingId);

        /// <summary>Mark a booking as "Completed" (post-session, admin/tutor).</summary>
        Response CompleteBooking(int bookingId);
    }
}
