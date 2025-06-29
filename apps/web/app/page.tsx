"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Auth } from "@/components/features/Auth";
import { AddNote } from "@/components/features/AddNote"; // We'll show this for now
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ReviewNotes } from "@/components/features/ReviewNotes";

export default function Home() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <Auth />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">WordNest</h1>
          <button onClick={logout} className="text-sm underline">Logout</button>
        </div>
        <Tabs defaultValue="add">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add Note</TabsTrigger>
            <TabsTrigger value="review">Review Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="add">
            <AddNote />
          </TabsContent>
          <TabsContent value="review">
            <ReviewNotes />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}