using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace PeerLearningAndTutorialSystem.Models
{
    public class ProcedureDBModel
    {
        public SqlParameter ResultStatusCode()
        {
            return new SqlParameter("@p_result_status_code", SqlDbType.Int)
            {
                Direction = ParameterDirection.Output
            };
        }

        public SqlParameter ExceptionMessage()
        {
            return new SqlParameter("@p_exception_message", SqlDbType.NVarChar, 500)
            {
                Direction = ParameterDirection.Output
            };
        }
    }
}