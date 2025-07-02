"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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
import { TagInput } from "./TagInput";
import { ImportButton } from "./ImportButton";
import { NoteItemDisplay } from "./NoteItemDisplay";

const ADD_FOLDER_VALUE = "__add_folder__";

export function AddNote() {
  const [newNoteText, setNewNoteText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isAddFolderDialogOpen, setAddFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

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

  const previewNoteMutation = useMutation<Note, Error, { text: string; folder_id?: number }>({
    mutationFn: (data) => api.post("/notes/preview", data).then((res) => res.data),
    onSuccess: (data) => {
      setPreviewNote(data);
    },
  });

  const createNoteMutation = useMutation<Note, Error, { text: string; tags: string[]; folder_id?: number }>({
    mutationFn: (data) => api.post("/notes", data).then((res) => res.data),
    onSuccess: () => {
      resetForm();
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

  const handlePreview = (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return toast.warning("Note cannot be empty.");
    previewNoteMutation.mutate({ text: newNoteText, folder_id: Number(selectedFolderId) });
  };

  const handleConfirmAndSave = () => {
    if (!previewNote) return;
    createNoteMutation.mutate({
      text: newNoteText,
      tags,
      folder_id: Number(selectedFolderId),
    });
  };

  const resetForm = useCallback(() => {
    setNewNoteText("");
    setTags([]);
    setPreviewNote(null);
    // Do not reset folder selection to keep it for the next note
  }, []);

  const handleCancelPreview = () => {
    setPreviewNote(null);
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
            {!previewNote ? (
              <form onSubmit={handlePreview} className="space-y-4">
                <Input
                  placeholder="e.g., Ubiquitous"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  disabled={previewNoteMutation.isPending}
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
                  disabled={previewNoteMutation.isPending}
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
                    disabled={previewNoteMutation.isPending}
                />
                <div className="flex items-center gap-2">
                    <Button type="submit" disabled={previewNoteMutation.isPending} className="flex-grow">
                      {previewNoteMutation.isPending ? "Analyzing..." : "Preview"}
                    </Button>
                    <ImportButton />
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed p-4">
                    <NoteItemDisplay note={previewNote} onEdit={() => {}} onDelete={() => {}} isDeleting={false} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelPreview}>Cancel</Button>
                  <Button onClick={handleConfirmAndSave} disabled={createNoteMutation.isPending}>
                    {createNoteMutation.isPending ? "Saving..." : "Confirm & Save"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
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
