"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SuggestionCardData } from "@/types/notes";
import { 
  Lightbulb, 
  BookOpen, 
  Edit3, 
  ArrowRight, 
  MapPin,
  CheckCircle,
  Plus
} from "lucide-react";
import { toast } from "sonner";

interface SuggestionPanelProps {
  suggestions: SuggestionCardData[];
  content: string;
  onContentChange: (content: string) => void;
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case "vocabulary":
      return BookOpen;
    case "language":
      return Edit3;
    case "rewrite":
      return Lightbulb;
    default:
      return Lightbulb;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "vocabulary":
      return "Vocabulary";
    case "language":
      return "Language";
    case "structure":
      return "Structure";
    default:
      return type;
  }
};

export function SuggestionPanel({ suggestions, content, onContentChange }: SuggestionPanelProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const handleApplySuggestion = (suggestion: SuggestionCardData) => {
    try {
      let newContent = content;
      
      if (suggestion.type === "vocabulary" && suggestion.data.original && suggestion.data.suggestion) {
        // Simple word replacement
        const regex = new RegExp(`\\b${suggestion.data.original}\\b`, 'gi');
        newContent = newContent.replace(regex, suggestion.data.suggestion);
      } else if ((suggestion.type === "language" || suggestion.type === "structure") && suggestion.data.original && suggestion.data.suggestion) {
        // Sentence/phrase replacement for both language and structure suggestions
        newContent = newContent.replace(suggestion.data.original, suggestion.data.suggestion);
      }
      
      if (newContent !== content) {
        onContentChange(newContent);
        setAppliedSuggestions(prev => new Set([...prev, suggestion.card_id]));
        toast.success("Suggestion applied successfully!");
      } else {
        toast.info("No changes were made. You may need to apply this suggestion manually.");
      }
    } catch (error) {
      toast.error("Failed to apply suggestion");
    }
  };

  const handleLocateText = (suggestion: SuggestionCardData) => {
    if (suggestion.data.original) {
      // This would ideally highlight the text in the editor
      // For now, we'll just show a toast with the location info
      const position = suggestion.data.position || "text content";
      toast.info(`Look for "${suggestion.data.original}" in ${position}`);
    }
  };

  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority as keyof typeof priorityOrder] - 
           priorityOrder[a.priority as keyof typeof priorityOrder];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Suggestions ({suggestions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No suggestions available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSuggestions.map((suggestion) => {
              const Icon = getSuggestionIcon(suggestion.type);
              const isApplied = appliedSuggestions.has(suggestion.card_id);
              
              return (
                <div
                  key={suggestion.card_id}
                  className={`border rounded-lg p-4 space-y-3 ${
                    isApplied ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-card'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {getTypeLabel(suggestion.type)}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    {isApplied && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  {/* Content based on suggestion type */}
                  {suggestion.type === "vocabulary" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          {suggestion.data.original}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {suggestion.data.suggestion}
                        </span>
                      </div>
                      {suggestion.data.position && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {suggestion.data.position}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {suggestion.data.explanation}
                      </p>
                    </div>
                  )}

                  {suggestion.type === "language" && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Original:</div>
                        <div className="font-essay text-sm bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 p-2 rounded border-l-2 border-red-200 dark:border-red-800 leading-relaxed">
                          {suggestion.data.original}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Suggestion:</div>
                        <div className="font-essay text-sm bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100 p-2 rounded border-l-2 border-green-200 dark:border-green-800 leading-relaxed">
                          {suggestion.data.suggestion}
                        </div>
                      </div>
                      {suggestion.data.improvements && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Improvements:</div>
                          <ul className="text-xs space-y-1">
                            {suggestion.data.improvements.map((improvement: string, index: number) => (
                              <li key={index} className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {suggestion.data.explanation}
                      </p>
                    </div>
                  )}

                  {suggestion.type === "structure" && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Original:</div>
                        <div className="font-essay text-sm bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 p-2 rounded border-l-2 border-red-200 dark:border-red-800 leading-relaxed">
                          {suggestion.data.original}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Suggestion:</div>
                        <div className="font-essay text-sm bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100 p-2 rounded border-l-2 border-green-200 dark:border-green-800 leading-relaxed">
                          {suggestion.data.suggestion}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.data.explanation}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {(suggestion.type === "vocabulary" || suggestion.type === "language" || suggestion.type === "structure") && 
                     suggestion.data.original && suggestion.data.suggestion && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={isApplied}
                        className="text-xs"
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Applied
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Apply
                          </>
                        )}
                      </Button>
                    )}
                    
                    {suggestion.data.original && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLocateText(suggestion)}
                        className="text-xs"
                      >
                        <MapPin className="mr-1 h-3 w-3" />
                        Locate
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => toast.info("Added to vocabulary notes")}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
