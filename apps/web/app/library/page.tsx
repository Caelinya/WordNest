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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { notesApi, foldersApi, tagsApi } from "@/lib/api";
import type { Note, Folder, Tag } from "@/types/notes";

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
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [similarity, setSimilarity] = useState(0.4);
  const [folderId, setFolderId] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [noteType, setNoteType] = useState<string>("");
  const [searchInContent, setSearchInContent] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedSimilarity = useDebounce(similarity, 200);

  const searchParams = {
    q: debouncedSearchQuery,
    semantic: isSemanticSearch,
    similarity: debouncedSimilarity,
    folder_id: folderId && folderId !== 'all' ? parseInt(folderId) : undefined,
    tags: selectedTags,
    note_type: noteType && noteType !== 'all' ? noteType : undefined,
    search_in_content: searchInContent,
  };

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["notes", "search", searchParams],
    queryFn: () => notesApi.search(searchParams),
    enabled: isAuthenticated,
  });
  
  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: foldersApi.getAll,
    enabled: isAuthenticated,
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: tagsApi.getAll,
    enabled: isAuthenticated,
  });
  
  const { data: notesCount } = useQuery<{ count: number }>({
    queryKey: ["notes", "count"],
    queryFn: notesApi.getCount,
    enabled: isAuthenticated,
  });

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by folder..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={String(folder.id)}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Filter by tags (comma-separated)..."
            onChange={(e) => setSelectedTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          />
          
          <Select value={noteType} onValueChange={setNoteType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="word">Word</SelectItem>
              <SelectItem value="sentence">Sentence</SelectItem>
              <SelectItem value="phrase">Phrase</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="semantic-search-toggle"
                checked={isSemanticSearch}
                onCheckedChange={setIsSemanticSearch}
              />
              <Label htmlFor="semantic-search-toggle">Semantic Search</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="search-content-toggle"
                checked={searchInContent}
                onCheckedChange={setSearchInContent}
              />
              <Label htmlFor="search-content-toggle">Search Content</Label>
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
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          {tags.length > 0 && <p className="text-sm text-muted-foreground">Available tags: {tags.map(t => t.name).join(', ')}</p>}
        </div>
      </div>
      <NoteList
        notes={notes || []}
        isLoading={isLoading}
        totalNotes={notesCount?.count || 0}
      />
    </div>
  );
}