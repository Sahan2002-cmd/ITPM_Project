using System.Web.Http;
using Unity;
using Unity.AspNet.WebApi;
using PeerLearningAndTutorialSystem.DataAccess;
using PeerLearningAndTutorialSystem.Interfaces;

namespace PeerLearningAndTutorialSystem
{
    public static class UnityConfig
    {
        public static void RegisterComponents()
        {
            var container = new UnityContainer();

            // ── Module 0: Users ──────────────────────────────────────────
            container.RegisterType<IUser, DAUser>();

            // ── Module 1: Tutor Profile & Availability ───────────────────
            container.RegisterType<ITutorProfile, DATutorProfile>();
            container.RegisterType<IAvailability, DAAvailability>();

            // ── Module 2: Session Booking & Notifications ────────────────
            container.RegisterType<IBooking,      DABooking>();
            container.RegisterType<INotification, DANotification>();

            // Unity.AspNet.WebApi resolver — fixes CS0266
            GlobalConfiguration.Configuration.DependencyResolver =
                new UnityDependencyResolver(container);
        }
    }
}