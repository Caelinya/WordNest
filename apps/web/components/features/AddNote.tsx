"use client";

import { useState, FormEvent, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useDisplayMode } from "@/contexts/DisplayModeContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { Note, Folder } from "@/types/notes";
import { NoteItem } from "./NoteItem";
import { TagInput } from "./TagInput";
import { ImportButton } from "./ImportButton";

const ADD_FOLDER_VALUE = "__add_folder__";

export function AddNote() {
  const [newNoteText, setNewNoteText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isAddFolderDialogOpen, setAddFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { displayMode, toggleDisplayMode } = useDisplayMode();

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: () => api.get("/notes").then((res) => res.data),
    enabled: isAuthenticated,
  });

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: () => api.get("/folders").then((res) => res.data),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (folders && !selectedFolderId) {
      const defaultFolder = folders.find((f: Folder) => f.name === 'default');
      if (defaultFolder) {
        setSelectedFolderId(defaultFolder.id.toString());
      }
    }
  }, [folders, selectedFolderId]);

  const createNoteMutation = useMutation<Note, Error, { text: string; tags: string[]; folder_id?: number }>({
    mutationFn: (data) => api.post("/notes", data).then((res) => res.data),
    onSuccess: (newNote) => {
      setNewNoteText("");
      setTags([]);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note created successfully!");
    },
  });

  const createFolderMutation = useMutation<Folder, Error, string>({
    mutationFn: (folderName) => api.post(`/folders?folder_name=${encodeURIComponent(folderName)}`, {}).then(res => res.data),
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setSelectedFolderId(newFolder.id.toString());
      setAddFolderDialogOpen(false);
      setNewFolderName("");
      toast.success(`Folder "${newFolder.name}" created successfully!`);
    },
  });

  const handleCreateNote = (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return toast.warning("Note cannot be empty.");
    createNoteMutation.mutate({ text: newNoteText, tags, folder_id: Number(selectedFolderId) });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return toast.warning("Folder name cannot be empty.");
    createFolderMutation.mutate(newFolderName);
  };

  return (
    <>
      <div className="container mx-auto p-4 sm:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Add a new Note</CardTitle>
            <CardDescription>
              Enter a word or phrase, select a folder, and add some tags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <Input
                placeholder="e.g., Ubiquitous"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                disabled={createNoteMutation.isPending}
              />
              <Select
                value={selectedFolderId}
                onValueChange={(value: string) => {
                  if (value === ADD_FOLDER_VALUE) {
                    setAddFolderDialogOpen(true);
                  } else {
                    setSelectedFolderId(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={ADD_FOLDER_VALUE} className="text-blue-600">
                    + Add New Folder
                  </SelectItem>
                </SelectContent>
              </Select>
              <TagInput
                  tags={tags}
                  setTags={setTags}
                  placeholder="Add tags..."
              />
              <div className="flex items-center gap-2">
                  <Button type="submit" disabled={createNoteMutation.isPending} className="flex-grow">
                    {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                  </Button>
                  <ImportButton />
              </div>
            </form>

            <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Your Notes</h3>
              <Button variant="outline" size="sm" onClick={toggleDisplayMode}>
                {displayMode === 'full' ? 'English-Only' : 'Show All'}
              </Button>
            </div>
            <div className="space-y-2">
              {isLoadingNotes ? (
                <p>Loading notes...</p>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))
              ) : (
                <p className="text-muted-foreground">
                  You haven't saved any notes yet.
                </p>
              )}
            </div>
          </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            <p>{notes.length} notes in total.</p>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isAddFolderDialogOpen} onOpenChange={setAddFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="e.g., Project Ideas"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
