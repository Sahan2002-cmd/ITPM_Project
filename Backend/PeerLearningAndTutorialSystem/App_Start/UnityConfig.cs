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

            // Register interface → implementation
            container.RegisterType<IUser, DAUser>();

            // Unity.AspNet.WebApi resolver — fixes CS0266
            GlobalConfiguration.Configuration.DependencyResolver =
                new UnityDependencyResolver(container);
        }
    }
}