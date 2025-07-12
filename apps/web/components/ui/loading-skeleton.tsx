"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "text" | "card";
  lines?: number;
}

export function LoadingSkeleton({ 
  className, 
  variant = "default",
  lines = 1 
}: LoadingSkeletonProps) {
  if (variant === "circular") {
    return (
      <div className={cn(
        "animate-pulse rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer",
        className
      )} />
    );
  }

  if (variant === "text") {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 animate-pulse rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer",
              i === lines - 1 && lines > 1 && "w-3/4", // Last line shorter
              className
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="space-y-4 p-6 border rounded-lg">
        <div className="flex items-center space-x-4">
          <LoadingSkeleton variant="circular" className="h-12 w-12" />
          <div className="space-y-2 flex-1">
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-3 w-1/2" />
          </div>
        </div>
        <LoadingSkeleton variant="text" lines={3} />
      </div>
    );
  }

  return (
    <div className={cn(
      "animate-pulse rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer",
      className
    )} />
  );
}

// Add shimmer animation to globals.css
export const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;
