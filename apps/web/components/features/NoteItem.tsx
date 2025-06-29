"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";

interface Note {
  id: number;
  text: string;
  translation: string | null;
}

interface NoteItemProps {
  note: Note;
}

export function NoteItem({ note }: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [editTranslation, setEditTranslation] = useState(note.translation || "");
  const queryClient = useQueryClient();

  // Mutation for DELETING a note
  const deleteMutation = useMutation({
    mutationFn: (noteId: number) => api.delete(`/notes/${noteId}`),
    onMutate: async (noteId: number) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["notes"] });

      // Snapshot the previous value
      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);

      // Optimistically remove the note from the list
      queryClient.setQueryData<Note[]>(["notes"], (old) =>
        old ? old.filter((n) => n.id !== noteId) : []
      );

      toast.success("Note deleted.");

      // Return a context object with the snapshotted value
      return { previousNotes };
    },
    onError: (err, noteId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousNotes) {
        queryClient.setQueryData(["notes"], context.previousNotes);
        toast.error("Failed to delete note. Restoring...");
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // Mutation for UPDATING a note
  const updateMutation = useMutation({
    mutationFn: (updatedNote: { text: string; translation: string }) =>
      api.put(`/notes/${note.id}`, updatedNote),
    onSuccess: (data) => {
      toast.success("Note updated successfully!");
      setIsEditing(false);
      // Update the query cache with the new data
      queryClient.setQueryData<Note[]>(["notes"], (old) =>
        old ? old.map((n) => (n.id === data.data.id ? data.data : n)) : []
      );
    },
    onError: () => {
        // The global error handler in api.ts will show a toast
    }
  });

  const handleUpdate = () => {
    const textChanged = editText.trim() !== note.text;
    const translationChanged = editTranslation.trim() !== (note.translation || "");

    if (!textChanged && !translationChanged) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate({
      text: editText,
      translation: editTranslation,
    });
  };

  const isLoading = updateMutation.isPending || deleteMutation.isPending;

  if (isEditing) {
    return (
      <div className="rounded-lg border p-4 bg-muted/50 space-y-4">
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Original text"
        />
        <Input
          value={editTranslation}
          onChange={(e) => setEditTranslation(e.target.value)}
          placeholder="Translation"
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleUpdate} disabled={isLoading}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex-grow">
        <p>{note.text}</p>
        {note.translation && (
          <p className="text-sm text-muted-foreground mt-1">
            {note.translation}
          </p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          aria-label="Edit note"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteMutation.mutate(note.id)}
          aria-label="Delete note"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </Button>
      </div>
    </div>
  );
}