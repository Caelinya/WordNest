"use client";

import { useState, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

import { Note } from "@/types/notes";

import { NoteItem } from "./NoteItem";
import { TagInput } from "./TagInput";

export function AddNote() {
  const [newNoteText, setNewNoteText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { displayMode, toggleDisplayMode } = useDisplayMode();

  // 1. Fetching data with useQuery
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await api.get("/notes");
      return response.data;
    },
    enabled: !!token, // Only run the query if the user is authenticated
  });

  // 2. Creating data with useMutation
  const createNoteMutation = useMutation<Note, Error, { text: string; tags: string[] }>({
    mutationFn: async (data: { text: string; tags: string[] }) => {
      const response = await api.post("/notes", data);
      return response.data;
    },
    onSuccess: (newNote) => {
      setNewNoteText("");
      setTags([]);
      queryClient.invalidateQueries({ queryKey: ["notes"] });

      if (newNote.corrected_text && newNote.text !== newNote.corrected_text) {
        toast.info(`Your input was corrected to: "${newNote.corrected_text}"`);
      } else {
        toast.success("Note created successfully!");
      }
    },
    onError: (error) => {
      console.error(error);
      // Global error handler in api.ts will show the toast
    },
  });

  // Handler for form submission
  const handleCreateNote = (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) {
      toast.warning("Note cannot be empty.");
      return;
    }
    createNoteMutation.mutate({ text: newNoteText, tags });
  };

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>WordNest</CardTitle>
          <CardDescription>
            Enter a word or a phrase you want to remember.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateNote} className="space-y-4">
            <Input
              type="text"
              placeholder="e.g., Ubiquitous"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              disabled={createNoteMutation.isPending}
            />
            <TagInput
                tags={tags}
                setTags={setTags}
                placeholder="Add tags (e.g., GRE, Work)..."
            />
            <Button type="submit" disabled={createNoteMutation.isPending} className="w-full">
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Your Notes</h3>
              <Button variant="outline" size="sm" onClick={toggleDisplayMode}>
                {displayMode === 'full' ? 'English-Only' : 'Show All'}
              </Button>
            </div>
            <div className="space-y-2">
              {isLoadingNotes ? (
                <p>Loading notes...</p>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))
              ) : (
                <p className="text-muted-foreground">
                  You haven&apos;t saved any notes yet.
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <p>{notes.length} notes in total.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
