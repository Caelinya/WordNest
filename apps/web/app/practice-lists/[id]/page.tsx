"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, GripVertical, BookOpen, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { practiceListsApi, notesApi } from "@/lib/api";
import { PracticeListDetail, Note, PracticeListUpdate } from "@/types/notes";
import Link from "next/link";
import { NoteItemDisplay } from "@/components/features/NoteItemDisplay";

const formatDate = (dateString?: string) => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return 'N/A';
  }
  return new Date(dateString).toLocaleDateString();
};

export default function PracticeListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = Number(params.id);

  const [list, setList] = useState<PracticeListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editData, setEditData] = useState<PracticeListUpdate>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [searching, setSearching] = useState(false);
  
  // For future: check if current user is the owner
  // const isOwner = list?.owner_id === currentUser?.id;
  const isOwner = true; // Currently, only owners can access their lists

  useEffect(() => {
    loadList();
  }, [listId]);

  const loadList = async () => {
    try {
      const data = await practiceListsApi.getById(listId);
      setList(data);
      setEditData({
        name: data.name,
        description: data.description,
      });
    } catch (error) {
      toast.error("Failed to load practice list");
      router.push("/practice-lists");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editData.name?.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    try {
      const updated = await practiceListsApi.update(listId, editData);
      setList({
        ...list!,
        name: updated.name,
        description: updated.description,
      });
      setIsEditDialogOpen(false);
      toast.success("Practice list updated successfully");
    } catch (error) {
      toast.error("Failed to update practice list");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await notesApi.search({
        q: searchQuery,
        search_in_content: true,
      });
      
      // Filter out notes already in the list
      const existingNoteIds = new Set(list?.items.map(item => item.note_id) || []);
      const filteredResults = results.filter((note: Note) => !existingNoteIds.has(note.id));
      
      setSearchResults(filteredResults);
    } catch (error) {
      toast.error("Failed to search notes");
    } finally {
      setSearching(false);
    }
  };

  const handleAddNotes = async () => {
    if (selectedNotes.length === 0) {
      toast.error("Please select at least one note");
      return;
    }

    try {
      const newItems = await practiceListsApi.addItems(listId, selectedNotes);
      
      // Update local state
      if (list) {
        setList({
          ...list,
          items: [...list.items, ...newItems],
          item_count: list.item_count + newItems.length,
        });
      }
      
      setIsAddDialogOpen(false);
      setSelectedNotes([]);
      setSearchResults([]);
      setSearchQuery("");
      toast.success(`Added ${newItems.length} notes to the list`);
    } catch (error) {
      toast.error("Failed to add notes to the list");
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to remove this note from the list?")) {
      return;
    }

    try {
      await practiceListsApi.removeItem(listId, itemId);
      
      // Update local state
      if (list) {
        setList({
          ...list,
          items: list.items.filter(item => item.id !== itemId),
          item_count: list.item_count - 1,
        });
      }
      
      toast.success("Note removed from the list");
    } catch (error) {
      toast.error("Failed to remove note from the list");
    }
  };

  const toggleNoteSelection = (noteId: number) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading practice list...</p>
        </div>
      </div>
    );
  }

  if (!list) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/practice-lists")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{list.name}</h1>
          {list.description && (
            <p className="text-muted-foreground mt-2">{list.description}</p>
          )}
        </div>
        {isOwner && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        <Button
          asChild
          variant="default"
        >
          <Link href={`/practice-lists/${listId}/review`}>
            <BookOpen className="mr-2 h-4 w-4" />
            Start Review
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Notes in this list</CardTitle>
              <CardDescription>
                {list.item_count} {list.item_count === 1 ? "note" : "notes"}
              </CardDescription>
            </div>
            {isOwner && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Notes
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {list.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No notes in this list yet
              </p>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add your first note
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {list.items.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    {isOwner && (
                      <div className="cursor-move opacity-50 hover:opacity-100">
                        <GripVertical className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <NoteItemDisplay
                        note={item.note}
                        onEdit={() => {
                          // Users can only edit their own notes
                          // This will be handled by the library page
                          router.push(`/library?edit=${item.note.id}`);
                        }}
                        onDelete={() => {
                          // In practice list context, "delete" means "remove from list"
                          // Only list owner can remove items
                          if (isOwner) {
                            handleRemoveItem(item.id);
                          }
                        }}
                        isDeleting={false}
                      />
                      <div className="mt-2 text-sm text-muted-foreground pl-4">
                        <span>Added {formatDate(item.added_at)}</span>
                        {item.review_count > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>
                              Reviewed {item.review_count} times (Last:{" "}
                              {formatDate(item.last_reviewed)})
                            </span>
                          </>
                        )}
                        <span className="mx-2">•</span>
                        <span>Mastery: {item.mastery_level}/5</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Practice List</DialogTitle>
            <DialogDescription>
              Update the name and description of your practice list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editData.name || ""}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editData.description || ""}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Notes Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Notes to List</DialogTitle>
            <DialogDescription>
              Search and select notes to add to your practice list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-lg p-4">
              {searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No notes found" : "Search for notes to add"}
                </p>
              ) : (
                searchResults.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedNotes.includes(note.id)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleNoteSelection(note.id)}
                  >
                    <NoteItemDisplay
                      note={note}
                      onEdit={() => {}} // No edit action in selection mode
                      onDelete={() => {}} // No delete action in selection mode
                      isDeleting={false}
                    />
                  </div>
                ))
              )}
            </div>
            
            {selectedNotes.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedNotes.length} note{selectedNotes.length !== 1 && "s"} selected
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedNotes([]);
                setSearchResults([]);
                setSearchQuery("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNotes}
              disabled={selectedNotes.length === 0}
            >
              Add Selected Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}