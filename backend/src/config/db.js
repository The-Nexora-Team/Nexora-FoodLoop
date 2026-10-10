import mongoose from 'mongoose';

let isMongoConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️  [DB] No MONGODB_URI provided. Operating in fast In-Memory Store mode.');
    return false;
  }

  try {
    // 5-second timeout for cloud Atlas connections
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    const sanitizedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('✅ [DB] Connected to MongoDB Atlas at:', sanitizedUri);
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

