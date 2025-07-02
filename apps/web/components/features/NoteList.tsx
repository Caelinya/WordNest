"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import api from "@/lib/api";
import { Note } from "@/types/notes";
import { NoteItem } from "./NoteItem";
import { Button } from "@/components/ui/button";

export function NoteList() {
  const { isAuthenticated } = useAuth();
  const { displayMode, toggleDisplayMode } = useDisplayMode();

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: () => api.get("/notes").then((res) => res.data),
    enabled: isAuthenticated,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Notes ({notes.length})</h2>
        <Button variant="outline" size="sm" onClick={toggleDisplayMode}>
          {displayMode === "full" ? "English-Only" : "Show All"}
        </Button>
      </div>
      <div className="space-y-2">
        {isLoadingNotes ? (
          <p>Loading notes...</p>
        ) : notes.length > 0 ? (
          notes.map((note) => <NoteItem key={note.id} note={note} />)
        ) : (
          <p className="text-muted-foreground">
            You haven't saved any notes yet.
          </p>
        )}
      </div>
    </div>
  );
}