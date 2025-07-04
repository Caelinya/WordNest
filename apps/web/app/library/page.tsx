"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Settings2 } from "lucide-react"; // Using an icon for the trigger
import { useAuth } from "@/contexts/AuthContext";
import { NoteList } from "@/components/features/NoteList";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [similarity, setSimilarity] = useState(0.4);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedSimilarity = useDebounce(similarity, 200);

  // Query for fetching all notes (to get the total count)
  const { data: allNotes = [] } = useQuery<Note[]>({
    queryKey: ["notes", "all"],
    queryFn: () => api.get("/notes").then((res) => res.data),
    enabled: isAuthenticated,
  });
  
  // Query for searching notes
  const { data: searchedNotes, isLoading: isSearchLoading } = useQuery<Note[]>({
    queryKey: ["notes", "search", debouncedSearchQuery, isSemanticSearch, debouncedSimilarity],
    queryFn: () => notesApi.search(debouncedSearchQuery, isSemanticSearch, debouncedSimilarity),
    enabled: isAuthenticated && !!debouncedSearchQuery,
  });

  const isLoading = isSearchLoading;
  const notesToShow = debouncedSearchQuery ? searchedNotes || [] : allNotes;

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-6 space-y-4">
        <Input
          type="search"
          placeholder="Search your notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-lg"
        />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="semantic-search-toggle" 
              checked={isSemanticSearch}
              onCheckedChange={setIsSemanticSearch}
            />
            <Label htmlFor="semantic-search-toggle">Semantic Search</Label>
          </div>
          {isSemanticSearch && (
             <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-muted-foreground">
                  <Settings2 className="h-4 w-4" />
                   <span>{similarity.toFixed(2)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-4">
                 <div className="space-y-4">
                  <Label className="text-sm">Similarity Threshold</Label>
                  <Slider
                    value={[similarity]}
                    onValueChange={(value) => setSimilarity(value[0])}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower values = stricter matching.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          )}
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