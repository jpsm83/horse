"use client";

import { toast } from "sonner";

// Toast utility functions
export const showToast = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  description: string
) => {
  const getToastStyle = (toastType: string) => {
    switch (toastType) {
      case "success":
        return {
          background: "green",
          color: "white",
          border: "none",
          borderRadius: "12px",
        };
      case "error":
        return {
          background: "red",
          color: "white",
          border: "none",
          borderRadius: "12px",
        };
      case "warning":
        return {
          background: "#da9100",
          color: "white",
          border: "none",
          borderRadius: "12px",
        };
      default:
        return {
          background: "blue",
          color: "white",
          border: "none",
          borderRadius: "12px",
        };
    }
  };

  const toastOptions = {
    description: description,
    duration: 3000,
    position: "top-center" as const,
    closeButton: false,
    style: getToastStyle(type),
  };

  switch (type) {
    case "success":
      toast.success(title, toastOptions);
      break;
    case "error":
      toast.error(title, toastOptions);
      break;
    case "warning":
      toast.warning(title, toastOptions);
      break;
    case "info":
      toast.info(title, toastOptions);
      break;
    default:
      toast(title, toastOptions);
  }
};

// Component version for JSX usage
const Toasts = ({
  type,
  title,
  description,
}: {
  type: "success" | "error" | "warning" | "info";
  title: string;
  description: string;
}) => {
  showToast(type, title, description);
  return null;
};

export default Toasts;
