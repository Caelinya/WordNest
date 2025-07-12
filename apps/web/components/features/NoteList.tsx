"use client";

import React from "react";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { Note } from "@/types/notes";
import { NoteItem } from "./NoteItem";
import { Button } from "@/components/ui/button";

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
  totalNotes: number; // To show the total count even when search results are displayed
}

export const NoteList = React.memo(function NoteList({ notes, isLoading, totalNotes }: NoteListProps) {
  const { displayMode, toggleDisplayMode } = useDisplayMode();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Notes ({totalNotes})</h2>
        <Button variant="outline" size="sm" onClick={toggleDisplayMode}>
          {displayMode === "full" ? "English-Only" : "Show All"}
        </Button>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          <p>Loading notes...</p>
        ) : notes.length > 0 ? (
          notes.map((note) => <NoteItem key={note.id} note={note} />)
        ) : (
          <p className="text-muted-foreground">
            No notes found. Try adjusting your search or add some new notes.
          </p>
        )}
      </div>
    </div>
  );
});