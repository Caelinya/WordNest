"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { NoteList } from "@/components/features/NoteList";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";
import { notesApi } from "@/lib/api";
import { Note } from "@/types/notes";

// A custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function LibraryPage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSemanticSearch, setIsSemanticSearch] = useState(true);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Query for fetching all notes (to get the total count)
  const { data: allNotes = [] } = useQuery<Note[]>({
    queryKey: ["notes", "all"],
    queryFn: () => api.get("/notes").then((res) => res.data),
    enabled: isAuthenticated,
  });
  
  // Query for searching notes
  const { data: searchedNotes, isLoading: isSearchLoading } = useQuery<Note[]>({
    queryKey: ["notes", "search", debouncedSearchQuery, isSemanticSearch],
    queryFn: () => notesApi.search(debouncedSearchQuery, isSemanticSearch),
    enabled: isAuthenticated && !!debouncedSearchQuery,
  });

  const isLoading = isSearchLoading;
  const notesToShow = debouncedSearchQuery ? searchedNotes || [] : allNotes;

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-6 space-y-4">
        <Input
          type="search"
          placeholder="Search your notes (e.g., 'resilience', 'on the ball', '语法')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-lg"
        />
        <div className="flex items-center space-x-2">
          <Switch 
            id="semantic-search-toggle" 
            checked={isSemanticSearch}
            onCheckedChange={setIsSemanticSearch}
          />
          <Label htmlFor="semantic-search-toggle">Enable Semantic Search</Label>
        </div>
      </div>
      <NoteList 
        notes={notesToShow}
        isLoading={isLoading}
        totalNotes={allNotes.length}
      />
    </div>
  );
}