import mongoose from 'mongoose';

let isMongoConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️  [DB] No MONGODB_URI provided. Operating in fast In-Memory Store mode.');
    return false;
  }

  try {
    // Attempt fast connection with 2-second timeout so it never blocks or hangs
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log('✅ [DB] Connected to MongoDB at:', uri);
    return true;
  } catch (error) {
    console.warn('⚠️  [DB] MongoDB not detected or reachable (' + error.message + ').');
    console.log('🚀 [DB] Seamlessly falling back to In-Memory Store mode. All features active!');
    return false;
  }
}

export function isConnected() {
  return isMongoConnected;
}

