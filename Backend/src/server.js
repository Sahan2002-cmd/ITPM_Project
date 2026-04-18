import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { app } from "./app.js";

async function bootstrap() {
  try {
    await connectDb();

    app.listen(env.port, () => {
      console.log(`Module 5 backend running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void bootstrap();
