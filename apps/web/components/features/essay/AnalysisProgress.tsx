"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, Brain, Zap, AlertCircle } from "lucide-react";

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  onCancel?: () => void;
  modelName?: string;
}

const PROGRESS_STAGES = [
  {
    threshold: 0,
    message: "Initializing AI analysis...",
    icon: Sparkles,
    description: "Preparing to analyze your essay content"
  },
  {
    threshold: 15,
    message: "Analyzing grammar structure...",
    icon: Brain,
    description: "Checking grammar, sentence structure, and expression"
  },
  {
    threshold: 35,
    message: "Evaluating content quality...",
    icon: Brain,
    description: "Analyzing arguments, logic, and content depth"
  },
  {
    threshold: 55,
    message: "Checking language expression...",
    icon: Brain,
    description: "Evaluating vocabulary usage and language fluency"
  },
  {
    threshold: 75,
    message: "Generating improvement suggestions...",
    icon: Zap,
    description: "Preparing personalized improvement recommendations"
  },
  {
    threshold: 90,
    message: "Completing final scoring...",
    icon: Zap,
    description: "Calculating scores and generating report"
  }
];

export function AnalysisProgress({ isAnalyzing, onCancel, modelName }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    if (!isAnalyzing) {
      setProgress(0);
      setElapsedTime(0);
      setCurrentStage(0);
      setShowSlowWarning(false);
      return;
    }

    const startTime = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // 显示慢速警告（60秒后）
      if (elapsed >= 60 && !showSlowWarning) {
        setShowSlowWarning(true);
      }

      // 进度条逻辑：前60秒线性增长到80%，之后指数递减增长
      let newProgress;
      if (elapsed <= 60) {
        // 前60秒线性增长到80%
        newProgress = Math.min((elapsed / 60) * 80, 80);
      } else {
        // 60秒后指数递减增长，逐渐接近但不超过95%
        const overtime = elapsed - 60;
        const exponentialGrowth = 80 + 15 * (1 - Math.exp(-overtime / 30));
        newProgress = Math.min(exponentialGrowth, 95);
      }

      setProgress(newProgress);

      // 更新当前阶段
      const stage = PROGRESS_STAGES.findIndex((s, i) => 
        newProgress >= s.threshold && 
        (i === PROGRESS_STAGES.length - 1 || newProgress < PROGRESS_STAGES[i + 1].threshold)
      );
      setCurrentStage(Math.max(0, stage));
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnalyzing, showSlowWarning]);

  if (!isAnalyzing) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStageInfo = PROGRESS_STAGES[currentStage];
  const CurrentIcon = currentStageInfo.icon;

  const getModelDisplayName = (model?: string) => {
    if (!model) return "AI Model";
    if (model.includes("gemini-2.5-pro")) return "Gemini 2.5 Pro";
    if (model.includes("gemini-2.0-flash")) return "Gemini 2.0 Flash";
    if (model.includes("gpt-4")) return "GPT-4";
    return model;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-5 w-5 animate-pulse text-blue-500" />
            AI Essay Analysis in Progress
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(elapsedTime)}
            </Badge>
            {modelName && (
              <Badge variant="secondary" className="text-xs">
                {getModelDisplayName(modelName)}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{currentStageInfo.message}</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {currentStageInfo.description}
          </p>
        </div>

        {/* Slow model warning */}
        {showSlowWarning && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Analysis Taking Longer
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {modelName?.includes("2.5-pro")
                    ? "Gemini 2.5 Pro provides deeper analysis but requires more processing time. Please be patient, it usually takes 1-3 minutes."
                    : "The AI model is performing deep analysis, which may take several minutes. Please keep the page open."
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {onCancel && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs"
            >
              Cancel Analysis
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>💡 Please keep the page open during analysis</p>
          {elapsedTime > 30 && (
            <p>⏳ Complex essay analysis requires more time, please be patient</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
