"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

// Define the type for a single note
interface Note {
  id: number;
  text: string;
}

export function AddNote() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get("/notes");
      setNotes(response.data);
    } catch (error) {
      // Error is already handled by the interceptor
      console.error(error);
    }
  }, [token]);

  // Fetch notes when the component mounts or token changes
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Handler for form submission to create a new note
  const handleCreateNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) {
      toast.warning("Note cannot be empty.");
      return;
    }
    setIsLoading(true);
    if (!token) {
      toast.error("You must be logged in to create a note.");
      setIsLoading(false);
      return;
    }

    try {
      await api.post("/notes", { text: newNoteText });
      setNewNoteText("");
      toast.success("Note created successfully!");
      await fetchNotes(); // Refresh the list
    } catch (error) {
      console.error(error);
      toast.error("Failed to create note.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for deleting a note
  const handleDeleteNote = async (noteId: number) => {
    if (!token) {
      toast.error("You must be logged in to delete a note.");
      return;
    }
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      toast.success("Note deleted successfully!");
    } catch (error) {
      // Error is already handled by the interceptor
      console.error(error);
    }
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
          <form onSubmit={handleCreateNote} className="flex gap-4">
            <Input
              type="text"
              placeholder="e.g., Ubiquitous"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Note"}
            </Button>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Your Notes</h3>
            <div className="space-y-2">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <p className="flex-grow">{note.text}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label="Delete note"
                      className="ml-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
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
