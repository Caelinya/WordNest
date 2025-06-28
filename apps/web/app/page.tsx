import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AddNote } from "@/components/features/AddNote";
import { ReviewNotes } from "@/components/features/ReviewNotes";

export default function Home() {
  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">WordNest</h1>
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