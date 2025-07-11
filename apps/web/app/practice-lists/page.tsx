"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { practiceListsApi } from "@/lib/api";
import { PracticeList, PracticeListCreate } from "@/types/notes";
import Link from "next/link";

export default function PracticeListsPage() {
  const [lists, setLists] = useState<PracticeList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newList, setNewList] = useState<PracticeListCreate>({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const data = await practiceListsApi.getAll();
      setLists(data);
    } catch (error) {
      toast.error("Failed to load practice lists");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newList.name.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    try {
      const created = await practiceListsApi.create(newList);
      setLists([created, ...lists]);
      setIsCreateDialogOpen(false);
      setNewList({ name: "", description: "" });
      toast.success("Practice list created successfully");
    } catch (error) {
      toast.error("Failed to create practice list");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this practice list?")) {
      return;
    }

    try {
      await practiceListsApi.delete(id);
      setLists(lists.filter(list => list.id !== id));
      toast.success("Practice list deleted successfully");
    } catch (error) {
      toast.error("Failed to delete practice list");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading practice lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Practice Lists</h1>
          <p className="text-muted-foreground mt-2">
            Create custom lists to organize and practice your notes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Practice List</DialogTitle>
              <DialogDescription>
                Create a new practice list to organize your notes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  placeholder="e.g., Business English Vocabulary"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newList.description || ""}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  placeholder="Describe the purpose of this list..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              You haven't created any practice lists yet
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first list
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{list.name}</CardTitle>
                {list.description && (
                  <CardDescription className="line-clamp-2">
                    {list.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    {list.itemCount} {list.itemCount === 1 ? "note" : "notes"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Updated {new Date(list.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    <Link href={`/practice-lists/${list.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link href={`/practice-lists/${list.id}/review`}>
                      Start Review
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(list.id)}
                    className="px-2"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}