"use client";

import { X } from "lucide-react";
import ReactJson from "@uiw/react-json-view";

interface ViewJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: object | undefined;
  title?: string;
}

export default function ViewJsonModal({
  isOpen,
  onClose,
  data,
  title = "JSON Viewer",
}: ViewJsonModalProps) {

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300">
          <h3 className="text-sm font-mono text-gray-600 uppercase tracking-wide font-bold">
            {title || "JSON Viewer"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* JSON Content */}
        <div className="flex-1 overflow-auto px-4 py-3">
          <ReactJson
            value={data}
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={true}
            collapsed={false}
          />
        </div>
      </div>
    </div>
  );
}

// 68f8839da8e6260236aa2fea