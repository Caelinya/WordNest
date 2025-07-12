"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreDetail } from "@/types/notes";
import { Trophy, Target } from "lucide-react";

interface ScoreBarProps {
  scores: Record<string, ScoreDetail>;
  totalScore: number;
  maxScore: number;
  essayType: "application" | "continuation";
}

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "A":
      return "bg-green-500 text-white";
    case "B":
      return "bg-blue-500 text-white";
    case "C":
      return "bg-yellow-500 text-white";
    case "D":
      return "bg-orange-500 text-white";
    case "E":
      return "bg-red-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getOverallGrade = (percentage: number) => {
  if (percentage >= 90) return { grade: "A", label: "Excellent", color: "text-green-600" };
  if (percentage >= 80) return { grade: "B", label: "Good", color: "text-blue-600" };
  if (percentage >= 70) return { grade: "C", label: "Average", color: "text-yellow-600" };
  if (percentage >= 60) return { grade: "D", label: "Below Average", color: "text-orange-600" };
  return { grade: "E", label: "Needs Improvement", color: "text-red-600" };
};

const getCategoryDisplayName = (category: string, essayType: "application" | "continuation") => {
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

export function ScoreBar({ scores, totalScore, maxScore, essayType }: ScoreBarProps) {
  const percentage = Math.round((totalScore / maxScore) * 100);
  const overall = getOverallGrade(percentage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Score Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">
            {totalScore}/{maxScore}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className={overall.color}>
              {overall.grade}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({percentage}%) - {overall.label}
            </span>
          </div>
          <Progress value={percentage} className="w-full" />
        </div>

        {/* Category Scores */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" />
            Category Breakdown
          </div>
          
          {Object.entries(scores).map(([category, scoreDetail]) => {
            const categoryPercentage = Math.round((scoreDetail.score / scoreDetail.max) * 100);
            const displayName = getCategoryDisplayName(category, essayType);
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{displayName}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getGradeColor(scoreDetail.grade)}`}
                    >
                      {scoreDetail.grade}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {scoreDetail.score}/{scoreDetail.max}
                  </span>
                </div>
                <Progress value={categoryPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {scoreDetail.feedback}
                </p>
              </div>
            );
          })}
        </div>

        {/* Essay Type Info */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground text-center">
            {essayType === "application" 
              ? "Application Essay (Total: 15 points)" 
              : "Continuation Writing (Total: 25 points)"
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
