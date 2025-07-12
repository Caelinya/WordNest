"use client";

import { useState, useEffect } from "react";
import { essayApi } from "@/lib/api";
import { EssayCard } from "@/components/features/essay/EssayCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

import { Essay } from "@/types/notes";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function EssayHistoryPage() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    loadEssays();
  }, []);

  const loadEssays = async () => {
    try {
      setLoading(true);
      const essays = await essayApi.getAll();
      setEssays(essays);
    } catch (error) {
      console.error("Failed to load essays:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEssays = (essays || [])
    .filter((essay) => {
      const matchesSearch = essay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           essay.question?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || essay.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "oldest":
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading essays...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Essay History</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search essays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="continuation">Continuation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <LoadingSkeleton variant="circular" className="h-16 w-16" />
                <div className="space-y-2 flex-1">
                  <LoadingSkeleton className="h-5 w-3/4" />
                  <div className="flex gap-2">
                    <LoadingSkeleton className="h-4 w-16" />
                    <LoadingSkeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-md bg-muted/20">
                <LoadingSkeleton variant="text" lines={2} />
              </div>
              <div className="flex justify-between">
                <LoadingSkeleton className="h-3 w-24" />
                <LoadingSkeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEssays.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {(essays || []).length === 0 ? "No essays found. Start analyzing your first essay!" : "No essays match your search criteria."}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEssays.map((essay) => (
            <EssayCard key={essay.id} essay={essay} onUpdate={loadEssays} />
          ))}
        </div>
      )}
    </div>
  );
}