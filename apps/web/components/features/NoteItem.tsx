"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { TagBadge } from "../ui/TagBadge";
import { TagInput } from "./TagInput";
import { Trash2, Pencil, Save, X } from 'lucide-react';

import { WordCard, WordAnalysis } from "./WordCard";
import { PhraseCard, PhraseAnalysis } from "./PhraseCard";
import { SentenceCard, SentenceAnalysis } from "./SentenceCard";
import { Note } from "@/types/notes";
import { useDisplayMode } from '@/contexts/DisplayModeContext';

interface NoteItemProps {
  note: Note;
}

// --- Main Component ---
export function NoteItem({ note }: NoteItemProps) {
  const queryClient = useQueryClient();
  const { displayMode } = useDisplayMode();
  const [isEditing, setIsEditing] = useState(false);
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  // --- Mutations ---

  // Mutation for DELETING a note
  const deleteMutation = useMutation({
    mutationFn: (noteId: number) => api.delete(`/notes/${noteId}`),
    onSuccess: () => {
      toast.success("Note deleted.");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => toast.error("Failed to delete note."),
  });

  // Mutation for UPDATING tags
  const updateTagsMutation = useMutation({
    mutationFn: (newTags: string[]) =>
      api.put(`/notes/${note.id}`, { tags: newTags }),
    onSuccess: () => {
      toast.success("Tags updated successfully!");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error) => {
      toast.error("Failed to update tags.");
      console.error(error);
    },
  });

  // --- Handlers ---

  const handleEditClick = () => {
    setCurrentTags(note.tags.map(tag => tag.name));
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    updateTagsMutation.mutate(currentTags);
  };

  // --- Render Logic ---

  const renderCardContent = () => {
    if (!note.translation) {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          No translation data available.
        </p>
      );
    }

    switch (note.type) {
      case "word":
        return <WordCard data={note.translation as WordAnalysis} />;
      case "phrase":
        return <PhraseCard data={note.translation as PhraseAnalysis} />;
      case "sentence":
        return <SentenceCard data={note.translation as SentenceAnalysis} />;
      default:
        // Fallback for unknown types
        return (
            <p className="mt-2 text-sm text-red-500">
                Unsupported note type: {note.type}
            </p>
        );
    }
  };

  const renderTags = () => {
    if (isEditing) {
      return (
        <div className="mt-2 space-y-2">
            <TagInput tags={currentTags} setTags={setCurrentTags} placeholder="Add or remove tags..."/>
        </div>
      );
    }

    if (note.tags && note.tags.length > 0) {
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2 group/tags">
          {note.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
           <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 transition-opacity group-hover/tags:opacity-100" onClick={handleEditClick}>
                <Pencil className="h-4 w-4" />
           </Button>
        </div>
      );
    }
    
    // Render an edit button even if there are no tags
    return (
        <div className="mt-2">
            <Button variant="outline" size="sm" onClick={handleEditClick}>
                <Pencil className="h-4 w-4 mr-2" />
                Add Tags
            </Button>
        </div>
    )
  };

  return (
    <div className="group flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex-grow">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{note.text}</h3>
          {note.type === 'word' && note.translation && (note.translation as WordAnalysis).phonetic && (
            <span className="text-sm text-muted-foreground font-sans">
              [{(note.translation as WordAnalysis).phonetic}]
            </span>
          )}
        </div>
        
        {renderTags()}

        {displayMode === 'full' && renderCardContent()}
      </div>

       <div className="ml-4 flex-shrink-0">
          {isEditing ? (
            <div className="flex gap-2 opacity-100">
                <Button variant="outline" size="icon" onClick={handleSaveClick} disabled={updateTagsMutation.isPending}>
                    <Save className="h-4 w-4" />
                </Button>
                 <Button variant="ghost" size="icon" onClick={handleCancelClick}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
          ) : (
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(note.id)}
                    aria-label="Delete note"
                    disabled={deleteMutation.isPending}
                >
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
          )}
      </div>
    </div>
  );
}