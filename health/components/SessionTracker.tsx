"use client";

import { useEffect } from "react";

export default function SessionTracker() {
  useEffect(() => {
    // Initialize browser session - create session ID if it doesn't exist
    if (typeof window !== "undefined") {
      let sessionId = sessionStorage.getItem("site_session_id");

      if (!sessionId) {
        // Generate a unique session ID for this browser session
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        sessionStorage.setItem("site_session_id", sessionId);
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
}

