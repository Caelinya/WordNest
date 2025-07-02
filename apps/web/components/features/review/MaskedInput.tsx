"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { ReviewStatus } from '@/hooks/use-flashcard';
import type { CharacterDetail } from '@/hooks/use-flashcard';

interface MaskedInputProps {
  characterDetails: CharacterDetail[];
  userInput: string;
  status: ReviewStatus;
  shakeCount: number;
}

// --- Component ---
export function MaskedInput({
  characterDetails,
  userInput,
  status,
  shakeCount,
}: MaskedInputProps) {
  
  const statusColorClass = {
    typing: "text-primary",
    correct: "text-green-500",
    incorrect: "text-yellow-500", // This will be triggered by shake
    revealed: "text-red-500",
  }[status];

  // We use a key on the outer div to force a re-render of the animation
  // when the shakeCount changes.
  const shakeKey = `shake-${shakeCount}`;

  return (
    <div className="flex items-center justify-center space-x-1 text-2xl md:text-3xl font-mono tracking-widest">
      <div
        key={shakeKey}
        className={cn(
          "flex items-center justify-center transition-colors duration-300",
          statusColorClass,
          status === 'typing' && shakeCount > 0 ? "animate-shake" : ""
        )}
      >
        {characterDetails.map((detail, index) => {
          if (detail.type === 'whitespace') {
            return <span key={`space-${index}`} className="w-4"></span>;
          }

          const typedChar = userInput[index];
          let displayChar = '_';
          let isHintLook = false;
          
          if (typedChar) {
            displayChar = typedChar;
          } else if (detail.isHint) {
            displayChar = detail.originalChar;
            isHintLook = true;
          }

          return (
            <span
              key={`${detail.originalChar}-${index}`}
              className={cn("inline-block w-6 text-center", {
                "text-muted-foreground": isHintLook,
              })}
            >
              {displayChar}
            </span>
          );
        })}
      </div>
    </div>
  );
}