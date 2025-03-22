import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/gptoncrack";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

let cached = global as any;

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    const opts = {
      bufferCommands: true,
    };

    cached.mongoose.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.mongoose.conn = await cached.mongoose.promise;
  } catch (e) {
    cached.mongoose.promise = null;
    throw e;
  }

  return cached.mongoose.conn;
}

export default dbConnect;
