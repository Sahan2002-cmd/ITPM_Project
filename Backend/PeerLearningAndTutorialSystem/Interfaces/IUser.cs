using PeerLearningAndTutorialSystem.Models;
using PeerLearningAndTutorialSystem.Models.RequestApiModels;

namespace PeerLearningAndTutorialSystem.Interfaces
{
    /// <summary>
    /// Interface for all User data-access operations.
    /// Implemented by DAUser.
    /// </summary>
    public interface IUser
    {
        // ── Read ─────────────────────────────────────────────────────────
        Response GetAllUsers();
        Response GetUserById(int userId);
        Response GetAllTutors();
        Response GetStudentsForTutor(int tutorId);

        // ── Write ────────────────────────────────────────────────────────
        Response Register(UserRequestApi request);

        /// <param name="callerId">userId from JWT (the person making the request).</param>
        /// <param name="callerRole">roleName from JWT ("Admin" | "Tutor" | "Student").</param>
        Response EditUser(UserRequestApi request, int callerId, string callerRole);

        Response DeleteUser(int userId, int adminId);
        Response ApproveUser(int userId, string status, int adminId);

        // ── Auth ─────────────────────────────────────────────────────────
        Response Login(UserRequestApi request);
        Response GoogleOAuthLogin(UserRequestApi request);

        // ── Forgot Password / OTP ────────────────────────────────────────
        Response RequestOtp(string email, string otpCode);
        Response VerifyOtp(string email, string otpCode);
        Response ResetPassword(UserRequestApi request);
    }
}