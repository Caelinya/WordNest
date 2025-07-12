"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, FileText, Calendar, TrendingUp } from "lucide-react";
import { essayApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Essay } from "@/types/notes";
import { CircularProgress } from "@/components/ui/circular-progress";

interface EssayCardProps {
  essay: Essay;
  onUpdate: () => void;
}

export function EssayCard({ essay, onUpdate }: EssayCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const latestVersion = essay.versions[0];
  const scorePercentage = latestVersion
    ? Math.round((latestVersion.total_score / latestVersion.max_score) * 100)
    : null;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "argumentative": return "bg-blue-100 text-blue-800";
      case "narrative": return "bg-green-100 text-green-800";
      case "descriptive": return "bg-purple-100 text-purple-800";
      case "expository": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await essayApi.delete(essay.id);
      onUpdate();
    } catch (error) {
      console.error("Failed to delete essay:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            {/* Score Circle */}
            {scorePercentage !== null && (
              <div className="flex-shrink-0">
                <CircularProgress
                  value={scorePercentage}
                  size={64}
                  strokeWidth={6}
                  className="group-hover:scale-105 transition-transform duration-300"
                  showValue={false}
                >
                  <div className="text-center">
                    <div className={`text-sm font-bold ${getScoreColor(scorePercentage)}`}>
                      {scorePercentage}%
                    </div>
                  </div>
                </CircularProgress>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg leading-6 line-clamp-2 group-hover:text-primary transition-colors">
                  {essay.title}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/essays/${essay.id}`} className="cursor-pointer">
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge className={getTypeColor(essay.type)} variant="secondary">
                  {essay.type}
                </Badge>
                {essay.versions.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {essay.versions.length} version{essay.versions.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {essay.question && (
            <div className="mb-4 p-3 rounded-md bg-muted/30 border border-border/30">
              <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                {essay.question}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Updated {formatDistanceToNow(new Date(essay.updated_at), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1 text-primary/60">
              <FileText className="h-3 w-3" />
              <span>Essay #{essay.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Essay</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{essay.title}&rdquo;? This action cannot be undone and will also delete all versions and analysis data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}