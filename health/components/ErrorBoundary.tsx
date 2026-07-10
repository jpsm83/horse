"use client";

import React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Button } from "./ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  showButton?: boolean;
  buttonText?: string;
  context?: string;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  onError,
  onReset,
  buttonText = "Try again",
  showButton = true,
}) => {
  const handleError = async (error: Error, errorInfo: React.ErrorInfo) => {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);

    // Call custom error handler
    onError?.(error, errorInfo);
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <ReactErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="flex h-full flex-col justify-center items-center text-center p-8">
          <h2 className="text-red-600 text-xl font-semibold mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">Please try again later.</p>
          <details className="mb-6 text-left" hidden={true}>
            <summary className="cursor-pointer text-gray-700 font-medium mb-2">
              Error details
            </summary>
            <pre className="bg-gray-50 p-4 rounded text-sm text-red-600 overflow-x-auto whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
          {showButton && (
            <Button
              onClick={resetErrorBoundary}
              size="sm"
              className="w-50"
            >
              {buttonText}
            </Button>
          )}
        </div>
      )}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
