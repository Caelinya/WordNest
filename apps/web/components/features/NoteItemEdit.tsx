"use client";

import { Button } from "@/components/ui/button";
import { TagInput } from "./TagInput";
import { Save, X, BrainCircuit } from 'lucide-react';

interface NoteItemEditProps {
  editText: string;
  setEditText: (text: string) => void;
  currentTags: string[];
  setCurrentTags: (tags: string[]) => void;
  onSave: (reAnalyze: boolean) => void;
  onCancel: () => void;
  isUpdating: boolean;
}

export function NoteItemEdit({
  editText,
  setEditText,
  currentTags,
  setCurrentTags,
  onSave,
  onCancel,
  isUpdating,
}: NoteItemEditProps) {
  return (
    <div className="group flex flex-col rounded-lg border p-4 bg-muted/20">
      <textarea
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        className="w-full p-2 text-lg font-semibold bg-transparent border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows={3}
        autoFocus
      />
      <div className="mt-2 space-y-2">
        <TagInput tags={currentTags} setTags={setCurrentTags} placeholder="Add or remove tags..."/>
        <div className="mt-4 flex justify-end items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onSave(false)} disabled={isUpdating} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSave(true)} disabled={isUpdating} className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" />
            <span>Save & Re-analyze</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}