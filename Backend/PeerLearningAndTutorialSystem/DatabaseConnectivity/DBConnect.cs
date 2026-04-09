using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace PeerLearningAndTutorialSystem.DatabaseConnectivity
{
    public class DBConnect
    {
        private readonly string _connectionString;

        public DBConnect()
        {
            _connectionString = ConfigurationManager.ConnectionStrings["PeerLearningDB"].ConnectionString;
        }

        // Executes a stored procedure and returns a DataTable of results.
        // Output parameters must be included in the params array — they are read after execute.
        public DataTable ExecuteProcedure(string procedureName, SqlParameter[] parameters)
        {
            var dt = new DataTable();
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand(procedureName, conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.CommandTimeout = 30;

                if (parameters != null)
                    cmd.Parameters.AddRange(parameters);

                conn.Open();
                using (var adapter = new SqlDataAdapter(cmd))
                {
                    adapter.Fill(dt);
                }
            }
            return dt;
        }
    }
}