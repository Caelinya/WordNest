"use client";

import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";

type ReviewStatus = 'pristine' | 'typing' | 'correct' | 'incorrect' | 'revealed';

interface MaskedInputProps {
  answer: string;
  userInput: string;
  status: ReviewStatus;
  visualHintMap?: Map<number, string>;
  hintFlashIndex?: number | null;
  hintShakeIndex?: number | null;
  onAnimationComplete: () => void;
}

export function MaskedInput({
  answer,
  userInput,
  status,
  visualHintMap = new Map(),
  hintFlashIndex,
  hintShakeIndex,
  onAnimationComplete,
}: MaskedInputProps) {
  
  const characters = useMemo(() => {
    const answerChars = answer.split('');
    let visualIndex = 0;

    return answerChars.map((char, index) => {
      if (/\s/.test(char)) {
        return { char: ' ', type: 'whitespace' as const, visualIndex: -1, key: `space-${index}` };
      }

      const key = `${char}-${visualIndex}`;
      const isHint = visualHintMap.has(visualIndex);
      const typedChar = userInput[visualIndex];
      
      let result;
      if (typedChar) {
          result = { char: typedChar, type: 'typed' as const, visualIndex };
      } else if (isHint) {
        result = { char: answer[index], type: 'hint' as const, visualIndex };
      } else {
        result = { char: '_', type: 'placeholder' as const, visualIndex };
      }
      
      visualIndex++;
      return { ...result, key };
    });
  }, [answer, userInput, visualHintMap]);

  const statusColorClass = {
    pristine: "text-primary",
    typing: "text-primary",
    correct: "text-green-500",
    incorrect: "text-yellow-500 animate-shake",
    revealed: "text-red-500",
  }[status];

  return (
    <div className="flex items-center justify-center space-x-1 text-2xl md:text-3xl font-mono tracking-widest">
      <div
        className={cn(
          "flex items-center justify-center transition-colors duration-300",
          statusColorClass
        )}
      >
        {characters.map((item) => {
          if (item.type === 'whitespace') {
            return <span key={item.key} className="w-4"></span>;
          }
          return (
            <span
              key={item.key}
              onAnimationEnd={onAnimationComplete}
              className={cn("inline-block w-6 text-center", {
                "text-muted-foreground": item.type === 'hint',
                "animate-glow": hintFlashIndex === item.visualIndex,
                "animate-shake": hintShakeIndex === item.visualIndex,
              })}
            >
              {item.char}
            </span>
          );
        })}
      </div>
    </div>
  );
}