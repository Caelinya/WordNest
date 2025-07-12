"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/lib/api";
import { toast } from "sonner";
import { Note } from "@/types/notes";

export function useNoteItem(note: Note) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  const updateNoteMutation = useMutation({
    mutationFn: (variables: { text: string; tags: string[]; reAnalyze: boolean }) =>
      notesApi.update(note.id, {
        text: variables.text,
        tags: variables.tags,
      }, variables.reAnalyze),
    onSuccess: () => {
      toast.success("Note updated successfully!");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error) => {
      toast.error("Failed to update note.");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: number) => notesApi.delete(noteId),
    onSuccess: () => {
      toast.success("Note deleted.");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => toast.error("Failed to delete note."),
  });

  const handleEditClick = () => {
    setCurrentTags(note.tags.map((tag) => tag.name));
    setEditText(note.corrected_text || note.text);
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = (reAnalyze = false) => {
    updateNoteMutation.mutate({ text: editText, tags: currentTags, reAnalyze });
  };

  const handleDelete = () => {
    deleteMutation.mutate(note.id);
  };

  return {
    isEditing,
    editText,
    setEditText,
    currentTags,
    setCurrentTags,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteMutation.isPending,
    handleEditClick,
    handleCancelClick,
    handleSaveClick,
    handleDelete,
  };
}