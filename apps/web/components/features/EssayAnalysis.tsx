"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api, { essayApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { toast } from "sonner";
import { EssayAnalysisRequest, EssayAnalysisResponse, Essay } from "@/types/notes";
import { ScoreBar } from "./essay/ScoreBar";
import { SuggestionPanel } from "./essay/SuggestionPanel";
import { Loader2, FileText, Sparkles, Save } from "lucide-react";

export function EssayAnalysis() {
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [content, setContent] = useState("");
  const [essayType, setEssayType] = useState<"application" | "continuation">("application");
  const [analysisResult, setAnalysisResult] = useState<EssayAnalysisResponse | null>(null);
  const [currentEssay, setCurrentEssay] = useState<Essay | null>(null);

  const { isAuthenticated } = useAuth();

  const analyzeEssayMutation = useMutation({
    mutationFn: async (data: EssayAnalysisRequest) => {
      return await essayApi.analyze(data);
    },
    onSuccess: (data: EssayAnalysisResponse) => {
      setAnalysisResult(data);
      toast.success("Essay analysis completed!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Analysis failed");
    },
  });

  const saveVersionMutation = useMutation({
    mutationFn: async () => {
      if (!analysisResult) {
        throw new Error("No analysis result to save");
      }

      // Create essay if it doesn't exist
      let essay = currentEssay;
      if (!essay) {
        essay = await essayApi.create({
          title: title.trim() || `${essayType} Essay`,
          question: question.trim(),
          type: essayType,
        });
        setCurrentEssay(essay);
      }

      // Create version
      return await essayApi.createVersion(essay.id!, {
        content: content.trim(),
        scores: analysisResult.scores,
        total_score: analysisResult.total_score,
        max_score: analysisResult.max_score,
      });
    },
    onSuccess: () => {
      toast.success("Essay version saved successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save essay version");
    },
  });

  const handleAnalyze = () => {
    if (!question.trim() || !content.trim()) {
      toast.error("Please fill in both question and essay content");
      return;
    }

    analyzeEssayMutation.mutate({
      question: question.trim(),
      content: content.trim(),
      type: essayType,
    });
  };

  const handleReset = () => {
    setTitle("");
    setQuestion("");
    setContent("");
    setEssayType("application");
    setAnalysisResult(null);
    setCurrentEssay(null);
  };

  const handleSaveVersion = () => {
    if (!analysisResult) {
      toast.error("Please analyze the essay first");
      return;
    }
    saveVersionMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <p>Please log in to access essay analysis.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Essay Analysis</h1>
          <p className="text-muted-foreground">
            Get AI-powered feedback and suggestions for your essays
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Essay Input
              </CardTitle>
              <CardDescription>
                Enter your essay details and content for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Enter essay title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Essay Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Essay Type</Label>
                <Select value={essayType} onValueChange={(value: "application" | "continuation") => setEssayType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application Letter (15 points)</SelectItem>
                    <SelectItem value="continuation">Continuation Writing (25 points)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question */}
              <div className="space-y-2">
                <Label htmlFor="question">Essay Question/Prompt</Label>
                <Textarea
                  id="question"
                  placeholder="Enter the essay question or prompt..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Essay Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your essay content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Words: {content.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                  <span>Characters: {content.length}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeEssayMutation.isPending || !question.trim() || !content.trim()}
                  className="flex-1"
                >
                  {analyzeEssayMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Essay
                    </>
                  )}
                </Button>
                {analysisResult && (
                  <Button 
                    variant="outline" 
                    onClick={handleSaveVersion}
                    disabled={saveVersionMutation.isPending}
                  >
                    {saveVersionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Version
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-4">
          {analysisResult ? (
            <>
              <ScoreBar
                scores={analysisResult.scores}
                totalScore={analysisResult.total_score}
                maxScore={analysisResult.max_score}
                essayType={essayType}
              />
              <SuggestionPanel
                suggestions={analysisResult.suggestion_cards}
                content={content}
                onContentChange={setContent}
              />
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                <p className="text-muted-foreground text-sm">
                  Enter your essay content and click "Analyze Essay" to get AI-powered feedback and suggestions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
