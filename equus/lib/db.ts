import mongoose from "mongoose";

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim() || process.env.MONGO_DB_NAME?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }
  return uri;
}

const connectDb = async () => {
  const mongodbUri = getMongoUri();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || "equus";
  const connectionState = mongoose.connection.readyState;

  if (connectionState === 1 || connectionState === 2) {
    return;
  }

  await mongoose.connect(mongodbUri, {
    dbName,
    bufferCommands: true,
  });
};

export default connectDb;
