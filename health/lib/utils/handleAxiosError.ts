import axios from "axios";

// Helper method to handle errors
export const handleAxiosError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string; Error?: string };
    const message: string =
      responseData?.message ||
      responseData?.Error ||
      "An unexpected error occurred. Please try again.";
    throw new Error(message); // Throw the error with the backend message
  }
  throw new Error("An unexpected error occurred. Please try again."); // Fallback for non-Axios errors
};