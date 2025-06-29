"use client";

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Note } from '@/types/notes';

interface ImportReviewerProps {
  items: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportReviewer({ items, open, onOpenChange }: ImportReviewerProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(items));
  const queryClient = useQueryClient();

  const handleCheckboxChange = (item: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items));
    }
  };

  const batchCreateMutation = useMutation<Note[], Error, { text: string }[]>({
      mutationFn: async (notesToCreate) => {
          const promises = notesToCreate.map(note => api.post('/notes', { text: note.text, tags: [] }));
          const responses = await Promise.all(promises);
          return responses.map(res => res.data);
      },
      onSuccess: (createdNotes) => {
          toast.success(`${createdNotes.length} notes imported successfully!`);
          queryClient.invalidateQueries({ queryKey: ['notes'] });
          onOpenChange(false);
      },
      onError: (error) => {
          console.error("Batch import failed", error);
          toast.error("An error occurred during the import.");
      }
  });


  const handleImport = () => {
    const notesToCreate = Array.from(selectedItems).map(item => ({ text: item }));
    if (notesToCreate.length === 0) {
        toast.warning("Please select at least one item to import.");
        return;
    }
    batchCreateMutation.mutate(notesToCreate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review and Import</DialogTitle>
          <DialogDescription>
            Select the items you want to add to your collection. Uncheck any you don&apos;t need.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mb-4 border-b pb-4">
            <Checkbox
                id="select-all"
                checked={selectedItems.size > 0 && selectedItems.size === items.length}
                onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="font-medium">
                {selectedItems.size === items.length ? 'Deselect All' : 'Select All'} ({selectedItems.size} / {items.length})
            </label>
        </div>
        <ScrollArea className="h-72">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted">
                <Checkbox
                  id={`item-${index}`}
                  checked={selectedItems.has(item)}
                  onCheckedChange={() => handleCheckboxChange(item)}
                />
                <label htmlFor={`item-${index}`} className="flex-1 text-sm cursor-pointer">
                  {item}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={batchCreateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={selectedItems.size === 0 || batchCreateMutation.isPending}>
            {batchCreateMutation.isPending ? 'Importing...' : `Import ${selectedItems.size} Items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}