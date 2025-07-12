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
    threshold: 12,
    message: "Analyzing grammar structure...",
    icon: Brain,
    description: "Checking grammar, sentence structure, and expression"
  },
  {
    threshold: 28,
    message: "Evaluating content quality...",
    icon: Brain,
    description: "Analyzing arguments, logic, and content depth"
  },
  {
    threshold: 45,
    message: "Checking language expression...",
    icon: Brain,
    description: "Evaluating vocabulary usage and language fluency"
  },
  {
    threshold: 65,
    message: "Generating improvement suggestions...",
    icon: Zap,
    description: "Preparing personalized improvement recommendations"
  },
  {
    threshold: 82,
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
      const elapsed = (Date.now() - startTime) / 1000; // 使用更精确的时间
      setElapsedTime(Math.floor(elapsed));

      // 显示慢速警告（60秒后）
      if (elapsed >= 60 && !showSlowWarning) {
        setShowSlowWarning(true);
      }

      // 更平滑的进度条逻辑
      let newProgress;
      if (elapsed <= 45) {
        // 前45秒平滑增长到70%
        newProgress = (elapsed / 45) * 70;
      } else if (elapsed <= 90) {
        // 45-90秒继续增长到85%
        const progressInPhase = (elapsed - 45) / 45;
        newProgress = 70 + progressInPhase * 15;
      } else {
        // 90秒后缓慢接近95%，使用更平滑的函数
        const overtime = elapsed - 90;
        const slowGrowth = 85 + 10 * (1 - Math.exp(-overtime / 40));
        newProgress = Math.min(slowGrowth, 95);
      }

      // 使用动画函数让进度更平滑
      setProgress(prev => {
        const diff = newProgress - prev;
        // 如果差距较大，使用插值让变化更平滑
        if (Math.abs(diff) > 2) {
          return prev + diff * 0.3; // 缓慢追赶目标进度
        }
        return newProgress;
      });

      // 更平滑的阶段切换逻辑 - 使用当前进度值
      setProgress(currentProgress => {
        const nextStageIndex = PROGRESS_STAGES.findIndex((stage, i) => 
          currentProgress >= stage.threshold && 
          (i === PROGRESS_STAGES.length - 1 || currentProgress < PROGRESS_STAGES[i + 1].threshold)
        );
        
        if (nextStageIndex !== -1 && nextStageIndex !== currentStage) {
          // 延迟切换阶段，避免闪烁
          setTimeout(() => setCurrentStage(nextStageIndex), 300);
        }
        
        return currentProgress;
      });
    }, 200); // 更高频率的更新，让进度条更平滑

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
          <Progress value={progress} className="h-2 transition-all duration-300 ease-out" />
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
