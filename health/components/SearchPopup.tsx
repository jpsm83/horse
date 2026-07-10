"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchPopupProps {
  isOpen: boolean;
  searchTerm: string;
  placeholder: string;
  onClose: () => void;
  onSearch: (term: string) => void;
  onClear: () => void;
  onSearchChange: (value: string) => void;
}

export default function SearchPopup({
  isOpen,
  searchTerm,
  placeholder,
  onClose,
  onSearch,
  onClear,
  onSearchChange,
}: SearchPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 w-screen h-screen"
      onClick={onClose}
    >
      <div
        ref={popupRef}
        className="relative w-full max-w-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          {searchTerm && (
            <button
              onClick={onClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
              aria-label="Clear search"
            >
              <X size={20} />
            </button>
          )}
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch(searchTerm);
              }
              if (e.key === "Escape") {
                onClose();
              }
            }}
            className="w-full bg-white text-gray-900 placeholder:text-gray-500 border-gray-300 rounded-lg h-14 pl-12 pr-12 text-base focus:ring-purple-400 focus:border-purple-400"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

