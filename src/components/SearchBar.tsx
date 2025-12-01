"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
};

export default function SearchBar({
  onSearch,
  placeholder = "Search...",
  className = "",
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center ${className}`}
    >
      <div className="relative w-full">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-10 text-sm outline-none transition-colors focus:border-black"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </form>
  );
}
