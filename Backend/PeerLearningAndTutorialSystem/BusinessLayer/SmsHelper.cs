using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Configuration;

namespace PeerLearningAndTutorialSystem.BusinessLayer
{
    public static class SmsHelper
    {
        private static readonly string accountSid = ConfigurationManager.AppSettings["TwilioAccountSid"];
        private static readonly string authToken = ConfigurationManager.AppSettings["TwilioAuthToken"];
        private static readonly string fromPhone = ConfigurationManager.AppSettings["TwilioPhoneNumber"];

        public static void SendOtp(string toPhoneNumber, string otpCode)
        {
            if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken))
                return; // silently fail if not configured

            TwilioClient.Init(accountSid, authToken);
            MessageResource.Create(
                body: $"Your PeerLearn verification OTP is: {otpCode}",
                from: new Twilio.Types.PhoneNumber(fromPhone),
                to: new Twilio.Types.PhoneNumber(toPhoneNumber)
            );
        }
    }
}