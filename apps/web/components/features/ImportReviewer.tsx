"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Note } from '@/types/notes';

interface EditableItem {
  id: number;
  text: string;
  isSelected: boolean;
}

interface ImportReviewerProps {
  items: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportReviewer({ items, open, onOpenChange }: ImportReviewerProps) {
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Populate state when items prop changes
    setEditableItems(
      items.map((item, index) => ({
        id: index,
        text: item,
        isSelected: true, // Select all by default
      }))
    );
  }, [items, open]); // Rerun when a new import happens

  const handleCheckboxChange = (id: number) => {
    setEditableItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  };

  const handleTextChange = (id: number, newText: string) => {
     setEditableItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, text: newText } : item
      )
    );
  };

  const selectedCount = editableItems.filter(item => item.isSelected).length;

  const handleSelectAll = () => {
    const allSelected = selectedCount === editableItems.length;
    setEditableItems(prevItems =>
      prevItems.map(item => ({ ...item, isSelected: !allSelected }))
    );
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
    const notesToCreate = editableItems
      .filter(item => item.isSelected && item.text.trim() !== "")
      .map(item => ({ text: item.text }));
      
    if (notesToCreate.length === 0) {
        toast.warning("Please select at least one non-empty item to import.");
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
                checked={editableItems.length > 0 && selectedCount === editableItems.length}
                onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="font-medium">
                {selectedCount === editableItems.length ? 'Deselect All' : 'Select All'} ({selectedCount} / {editableItems.length})
            </label>
        </div>
        <ScrollArea className="h-72">
          <div className="space-y-2">
            {editableItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.isSelected}
                  onCheckedChange={() => handleCheckboxChange(item.id)}
                />
                <Input
                  value={item.text}
                  onChange={(e) => handleTextChange(item.id, e.target.value)}
                  className="flex-1 h-8"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={batchCreateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={selectedCount === 0 || batchCreateMutation.isPending}>
            {batchCreateMutation.isPending ? 'Importing...' : `Import ${selectedCount} Items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}