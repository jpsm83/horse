import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  process.env.AUTH_SECRET ??= "test-auth-secret";
  process.env.REFRESH_SECRET ??= "test-refresh-secret";
  process.env.AUTH_URL ??= "http://localhost:3000";
  process.env.EMAIL_USER ??= "test@example.com";
  process.env.EMAIL_PASSWORD ??= "test-password";

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(mongoServer.getUri(), { dbName: "equus-test" });
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
