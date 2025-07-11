"use client";

import { Note } from "@/types/notes";
import { TagBadge } from "@/components/ui/TagBadge";
import { WordCard, WordAnalysis } from "../WordCard";
import { PhraseCard, PhraseAnalysis } from "../PhraseCard";
import { SentenceCard, SentenceAnalysis } from "../SentenceCard";
import { Folder } from "lucide-react";
import { useDisplayMode } from "@/contexts/DisplayModeContext";

interface PracticeListNoteDisplayProps {
  note: Note;
  showDetails?: boolean;
}

export function PracticeListNoteDisplay({ note, showDetails = false }: PracticeListNoteDisplayProps) {
  const { displayMode } = useDisplayMode();

  const renderCardContent = () => {
    if (!note.translation) {
      return null;
    }
    switch (note.type) {
      case "word": return <WordCard data={note.translation as WordAnalysis} />;
      case "phrase": return <PhraseCard data={note.translation as PhraseAnalysis} />;
      case "sentence": return <SentenceCard data={note.translation as SentenceAnalysis} />;
      default:
        return null;
    }
  };

  return (
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

      {(showDetails || displayMode === 'full') && renderCardContent()}
    </div>
  );
}