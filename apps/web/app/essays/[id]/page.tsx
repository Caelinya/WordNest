"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { essayApi } from "@/lib/api";
import { Essay, EssayVersion } from "@/types/notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, TrendingUp, FileText, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function EssayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const essayId = parseInt(params.id as string);
  
  const [essay, setEssay] = useState<Essay | null>(null);
  const [versions, setVersions] = useState<EssayVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<EssayVersion | null>(null);

  useEffect(() => {
    if (essayId) {
      loadEssayData();
    }
  }, [essayId]);

  const loadEssayData = async () => {
    try {
      setLoading(true);
      const [essayData, versionsData] = await Promise.all([
        essayApi.get(essayId),
        essayApi.getVersions(essayId)
      ]);
      
      setEssay(essayData);
      setVersions(versionsData);
      
      // Select the latest version by default
      if (versionsData.length > 0) {
        setSelectedVersion(versionsData[0]);
      }
    } catch (error) {
      console.error("Failed to load essay data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "argumentative": return "bg-blue-100 text-blue-800";
      case "narrative": return "bg-green-100 text-green-800";
      case "descriptive": return "bg-purple-100 text-purple-800";
      case "expository": return "bg-orange-100 text-orange-800";
      case "application": return "bg-indigo-100 text-indigo-800";
      case "continuation": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getCategoryDisplayName = (category: string, essayType: string) => {
    const applicationCategories: Record<string, string> = {
      "Element Completeness": "Elements",
      "Format Specification": "Format",
      "Language Expression": "Language",
      "Handwriting Quality": "Handwriting"
    };

    const continuationCategories: Record<string, string> = {
      "Plot Coherence": "Plot",
      "Language Expression": "Language",
      "Theme Enhancement": "Theme",
      "Handwriting Quality": "Handwriting"
    };

    const categories = essayType === "application" ? applicationCategories : continuationCategories;
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <LoadingSkeleton className="h-8 w-16" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-8 w-2/3" />
            <div className="flex gap-2">
              <LoadingSkeleton className="h-5 w-20" />
              <LoadingSkeleton className="h-5 w-32" />
              <LoadingSkeleton className="h-5 w-24" />
            </div>
          </div>
        </div>

        {/* Question Card Skeleton */}
        <LoadingSkeleton variant="card" />

        {/* Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <LoadingSkeleton variant="card" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
          </div>
        </div>
      </div>
    );
  }

  if (!essay) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Essay Not Found</h1>
          <p className="text-gray-600 mb-4">The essay you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{essay.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getTypeColor(essay.type)} variant="secondary">
              {essay.type}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Created {formatDistanceToNow(new Date(essay.created_at), { addSuffix: true })}
            </div>
            {versions.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Essay Question */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Essay Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-foreground leading-relaxed text-base">{essay.question}</p>
          </div>
        </CardContent>
      </Card>

      {/* Versions */}
      {versions.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Version List */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Versions ({versions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {versions.map((version) => {
                  const scorePercentage = Math.round((version.total_score / version.max_score) * 100);
                  const isSelected = selectedVersion?.id === version.id;
                  
                  return (
                    <div
                      key={version.id}
                      className={`group p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-2 border-muted-foreground bg-muted/20 shadow-sm'
                          : 'border border-border hover:border-muted-foreground/50 hover:bg-muted/30'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <CircularProgress
                          value={scorePercentage}
                          size={40}
                          strokeWidth={4}
                          showValue={false}
                          className="flex-shrink-0"
                        >
                          <div className={`text-xs font-bold ${getScoreColor(scorePercentage)}`}>
                            {scorePercentage}%
                          </div>
                        </CircularProgress>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">
                            Version {version.version_number}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {version.total_score}/{version.max_score} points
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(version.created_at), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Selected Version Details */}
          <div className="lg:col-span-2">
            {selectedVersion && (
              <div className="space-y-6">
                {/* Scores */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex items-center gap-3">
                        <CircularProgress
                          value={Math.round((selectedVersion.total_score / selectedVersion.max_score) * 100)}
                          size={48}
                          strokeWidth={4}
                          showValue={false}
                        >
                          <div className="text-xs font-bold text-primary">
                            {Math.round((selectedVersion.total_score / selectedVersion.max_score) * 100)}%
                          </div>
                        </CircularProgress>
                        <div className="flex-1">
                          <div className="text-lg font-bold">Version {selectedVersion.version_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedVersion.total_score}/{selectedVersion.max_score} points
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/essays?edit=${essay.id}&content=${encodeURIComponent(selectedVersion.content)}`}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analyze Again
                          </Link>
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(selectedVersion.scores).map(([category, scoreDetail]: [string, any]) => {
                        const categoryPercentage = Math.round((scoreDetail.score / scoreDetail.max) * 100);
                        const displayName = getCategoryDisplayName(category, essay.type);
                        return (
                          <div key={category} className="p-4 rounded-lg bg-muted/20 border border-border/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <CircularProgress
                                  value={categoryPercentage}
                                  size={36}
                                  strokeWidth={3}
                                  showValue={false}
                                >
                                  <div className={`text-xs font-bold ${getScoreColor(categoryPercentage)}`}>
                                    {scoreDetail.grade}
                                  </div>
                                </CircularProgress>
                                <div>
                                  <span className="font-medium text-foreground">
                                    {displayName}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    {scoreDetail.score}/{scoreDetail.max} points
                                  </div>
                                </div>
                              </div>
                              <div className={`text-sm font-medium ${getScoreColor(categoryPercentage)}`}>
                                {categoryPercentage}%
                              </div>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed bg-background/50 p-3 rounded border">
                              {scoreDetail.feedback}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Essay Content */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Essay Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 rounded-lg bg-muted/20 border border-border/30">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <pre className="whitespace-pre-wrap essay-content text-foreground bg-transparent border-none p-0 m-0">
                          {selectedVersion.content}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Versions */}
      {versions.length === 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <div className="text-muted-foreground space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                <FileText className="h-8 w-8 opacity-50" />
              </div>
              <div className="space-y-4">
                <p className="text-lg font-medium text-foreground">No versions available</p>
                <p className="text-sm">Analyze this essay to create the first version and see detailed scores.</p>
                <Button asChild>
                  <Link href={`/essays?edit=${essay.id}`}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Analysis
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
