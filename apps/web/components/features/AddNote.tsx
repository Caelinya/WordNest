"use client";

import { useState, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  translation: string | null;
}

import { NoteItem } from "./NoteItem";

export function AddNote() {
  const [newNoteText, setNewNoteText] = useState("");
  const { token } = useAuth();
  const queryClient = useQueryClient();

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
  const createNoteMutation = useMutation({
    mutationFn: (newNoteText: string) =>
      api.post("/notes", { text: newNoteText }),
    onSuccess: () => {
      toast.success("Note created successfully!");
      setNewNoteText("");
      // 3. Invalidate the 'notes' query to refetch the list automatically
      queryClient.invalidateQueries({ queryKey: ["notes"] });
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
    createNoteMutation.mutate(newNoteText);
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
              disabled={createNoteMutation.isPending}
            />
            <Button type="submit" disabled={createNoteMutation.isPending}>
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Your Notes</h3>
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
