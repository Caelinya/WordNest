"use client";

import { useState, useEffect, FormEvent } from "react";
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

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch all notes from the API
  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes");
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      const data: Note[] = await response.json();
      setNotes(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notes.");
    }
  };

  // Fetch notes when the component mounts
  useEffect(() => {
    fetchNotes();
  }, []);

  // Handler for form submission to create a new note
  const handleCreateNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) {
      toast.warning("Note cannot be empty.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newNoteText }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      // Reset input and refetch notes to show the new one
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
                  <Card key={note.id} className="p-4">
                    <p>{note.text}</p>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">
                  You haven't saved any notes yet.
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
