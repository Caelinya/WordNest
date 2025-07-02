"use client";

import { NoteList } from "@/components/features/NoteList";

export default function LibraryPage() {
  return (
    <div className="container mx-auto p-4 sm:p-8">
      <NoteList />
    </div>
  );
}