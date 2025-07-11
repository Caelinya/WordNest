"use client";

import { Note, PracticeList } from "@/types/notes";
import { Button } from "@/components/ui/button";
import { TagBadge } from "../ui/TagBadge";
import { WordCard, WordAnalysis } from "./WordCard";
import { PhraseCard, PhraseAnalysis } from "./PhraseCard";
import { SentenceCard, SentenceAnalysis } from "./SentenceCard";
import { Pencil, Trash2, Folder, ListPlus } from "lucide-react";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import { useState } from "react";
import { practiceListsApi } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteItemDisplayProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function NoteItemDisplay({ note, onEdit, onDelete, isDeleting }: NoteItemDisplayProps) {
  const { displayMode } = useDisplayMode();
  const [practiceLists, setPracticeLists] = useState<PracticeList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [hasLoadedLists, setHasLoadedLists] = useState(false);

  const loadPracticeLists = async () => {
    if (hasLoadedLists) return; // Avoid loading multiple times

    setIsLoadingLists(true);
    try {
      const lists = await practiceListsApi.getAll();
      setPracticeLists(lists);
      setHasLoadedLists(true);
    } catch (error) {
      toast.error("Failed to load practice lists");
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleAddToPracticeList = async (listId: number) => {
    try {
      await practiceListsApi.addItems(listId, [note.id]);
      toast.success("Added to practice list");
    } catch (error) {
      toast.error("Failed to add to practice list");
    }
  };

  const renderCardContent = () => {
    if (!note.translation) {
      return (
        <p className="mt-2 text-sm text-muted-foreground">No analysis data available.</p>
      );
    }
    switch (note.type) {
      case "word": return <WordCard data={note.translation as WordAnalysis} />;
      case "phrase": return <PhraseCard data={note.translation as PhraseAnalysis} />;
      case "sentence": return <SentenceCard data={note.translation as SentenceAnalysis} />;
      default:
        return <p className="mt-2 text-sm text-red-500">Unsupported note type: {note.type}</p>;
    }
  };

  return (
    <div className="group flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex-grow">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{note.corrected_text || note.text}</h3>
          {note.type === 'word' && note.translation && (note.translation as WordAnalysis).phonetic && (
            <span className="text-sm text-muted-foreground font-sans">
              [{(note.translation as WordAnalysis).phonetic}]
            </span>
          )}
        </div>

        {note.folder && (
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <Folder className="mr-1 h-3 w-3" />
                <span>{note.folder.name}</span>
            </div>
        )}
        
        {note.tags && note.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {note.tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
        )}

        {displayMode === 'full' && renderCardContent()}
      </div>

      <div className="ml-4 flex-shrink-0">
        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu onOpenChange={(open) => {
            if (open) {
              loadPracticeLists();
            }
          }}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Add to practice list"
              >
                <ListPlus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Add to Practice List</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoadingLists ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
              ) : practiceLists.length === 0 ? (
                <>
                  <DropdownMenuItem disabled>No practice lists found</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/practice-lists'}>
                    Create a practice list
                  </DropdownMenuItem>
                </>
              ) : (
                practiceLists.map((list) => (
                  <DropdownMenuItem
                    key={list.id}
                    onClick={() => handleAddToPracticeList(list.id)}
                  >
                    {list.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({list.item_count} notes)
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit note">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete note"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4"/>
          </Button>
        </div>
      </div>
    </div>
  );
}