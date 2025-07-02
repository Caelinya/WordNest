"use client";

import { useNoteItem } from "@/hooks/use-note-item";
import { Note } from "@/types/notes";
import { NoteItemDisplay } from "./NoteItemDisplay";
import { NoteItemEdit } from "./NoteItemEdit";

interface NoteItemProps {
  note: Note;
}

export function NoteItem({ note }: NoteItemProps) {
  const {
    isEditing,
    editText,
    setEditText,
    currentTags,
    setCurrentTags,
    isUpdating,
    isDeleting,
    handleEditClick,
    handleCancelClick,
    handleSaveClick,
    handleDelete,
  } = useNoteItem(note);

  return isEditing ? (
    <NoteItemEdit
      editText={editText}
      setEditText={setEditText}
      currentTags={currentTags}
      setCurrentTags={setCurrentTags}
      onSave={handleSaveClick}
      onCancel={handleCancelClick}
      isUpdating={isUpdating}
    />
  ) : (
    <NoteItemDisplay
      note={note}
      onEdit={handleEditClick}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  );
}