"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

// --- TypeScript Interfaces to match backend's KnowledgeObject ---

interface Example {
  sentence: string;
  translation: string;
}

interface Definition {
  part_of_speech: string;
  translation: string;
  explanation: string;
  examples: Example[];
}

interface KnowledgeObject {
  word: string;
  definitions: Definition[];
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Note {
  id: number;
  text: string;
  translation: KnowledgeObject | null;
  tags: Tag[];
}

import { TagBadge } from "../ui/TagBadge";

interface NoteItemProps {
  note: Note;
}

export function NoteItem({ note }: NoteItemProps) {
  const queryClient = useQueryClient();

  // Mutation for DELETING a note (with optimistic update)
  const deleteMutation = useMutation({
    mutationFn: (noteId: number) => api.delete(`/notes/${noteId}`),
    onMutate: async (noteId: number) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previousNotes = queryClient.getQueryData<Note[]>(["notes"]);
      queryClient.setQueryData<Note[]>(["notes"], (old) =>
        old ? old.filter((n) => n.id !== noteId) : []
      );
      toast.success("Note deleted.");
      return { previousNotes };
    },
    onError: (err, noteId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(["notes"], context.previousNotes);
        toast.error("Failed to delete note. Restoring...");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  return (
    <div className="group flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex-grow">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{note.text}</h3>
        </div>

        {note.tags && note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
            </div>
        )}

        {note.translation ? (
          <Accordion type="single" collapsible className="w-full mt-2">
            {note.translation.definitions.map((def, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold">{def.part_of_speech}</span>
                    <span>{def.translation}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-4">{def.explanation}</p>
                  <ul className="space-y-3">
                    {def.examples.map((ex, exIndex) => (
                      <li key={exIndex} className="text-sm">
                        <p>{ex.sentence}</p>
                        <p className="text-muted-foreground">{ex.translation}</p>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">No detailed analysis available.</p>
        )}
      </div>
       <div className="ml-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(note.id)}
            aria-label="Delete note"
            disabled={deleteMutation.isPending}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </Button>
      </div>
    </div>
  );
}