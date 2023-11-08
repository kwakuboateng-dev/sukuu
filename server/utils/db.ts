import 'dotenv/config';
import mongoose from 'mongoose';

const dbUrl: string | undefined = process.env.MONGO_URI;

if (!dbUrl) {
  console.error('MONGO_URI environment variable is not set.');
  process.exit(1);
}

const maxConnectionRetries: number = parseInt(process.env.MAX_CONNECTION_RETRIES || '5', 10);
const retryInterval: number = parseInt(process.env.RETRY_INTERVAL_MS || '5000', 10);

let connectionAttempts: number = 0;

async function connectDB() {
  try {
    await mongoose.connect(dbUrl);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    await retryConnection();
  }
}

async function retryConnection() {
  while (connectionAttempts < maxConnectionRetries) {
    console.log(`Retrying MongoDB connection in ${retryInterval / 1000} seconds (attempt ${connectionAttempts + 1} of ${maxConnectionRetries}).`);
    await sleep(retryInterval); // Use a sleep function for readability
    connectionAttempts++;

    try {
      await connectDB(); // Retry the connection
      return; // If the connection succeeds, exit the retry loop
    } catch (error) {
      console.error('MongoDB connection attempt failed:', error.message);
    }
  }

  console.error(`Maximum retry count (${maxConnectionRetries}) reached. Unable to connect to MongoDB.`);
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default connectDB;
