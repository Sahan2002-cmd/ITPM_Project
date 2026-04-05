using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models
{
    public class Response
    {
        public int StatusCode { get; set; }
        public string Message { get; set; }
        public object Data { get; set; }

        public static Response Success(object data = null, string message = "Success")
            => new Response { StatusCode = 1, Message = message, Data = data };

        public static Response Fail(string message = "Failed")
            => new Response { StatusCode = 0, Message = message, Data = null };

        public static Response Error(string message = "Internal server error")
            => new Response { StatusCode = -1, Message = message, Data = null };
    }
}