import mongoose from "mongoose";

// Connection options for mongoose

// Simple connection state tracking to prevent spam
let isConnecting = false;

const connectDb = async (retries: number = 3): Promise<void> => {
  // Read MONGODB_URI at function call time (not module load time)
  // This allows env vars to be loaded before the function is called
  const MONGODB_URI: string | undefined = process.env.MONGODB_URI;
  
  // Check if URI is defined
  if (!MONGODB_URI) {
    const error = "MONGODB_URI is not defined in environment variables";
    console.error(error);
    throw new Error(error);
  }

  const connectionState = mongoose.connection.readyState;

  // Existing connection states
  if (connectionState === 1) {
    return; // Already connected, no need to log
  }

  if (connectionState === 2 || isConnecting) {
    // Wait for existing connection attempt to complete
    while (isConnecting && mongoose.connection.readyState === 2) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  // Set connecting flag to prevent concurrent attempts
  isConnecting = true;

  // Retry logic for mobile devices with unstable connections
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Define connection options with type
      const options = {
        dbName: "health-api",
        bufferCommands: true,
        // Add mobile-friendly connection options
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds socket timeout
        connectTimeoutMS: 10000, // 10 seconds connection timeout
      };

      // Connect with proper typing
      await mongoose.connect(MONGODB_URI, options);
      isConnecting = false;
      return;
    } catch (error: unknown) {
      console.error(`Database connection attempt ${attempt} failed:`, error);
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        if (error instanceof Error) {
          const errorMessage = `Database connection failed after ${retries} attempts: ${error.message}`;
          console.error("Database connection error:", error.message);
          throw new Error(errorMessage);
        } else {
          const errorMessage = "Unexpected error during database connection";
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Reset connecting flag if we get here
  isConnecting = false;
};

export default connectDb;
