"use client";

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useFlashcard } from '@/hooks/use-flashcard';
import type { FlashcardData } from '@/hooks/use-flashcard';
import { MaskedInput } from './MaskedInput';

interface FlashcardProps {
  card: FlashcardData;
  onCompleted: (rating: 'again' | 'good' | 'easy') => void;
}

export function Flashcard({ card, onCompleted }: FlashcardProps) {
  const {
    userInput,
    status,
    characterDetails,
    shake,
    handleKeyDown, // <-- We now get the handler from the hook
    handleRate,
    handleShowAnswer,
  } = useFlashcard(card, onCompleted);

  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to focus the container on mount and card change
  useEffect(() => {
    containerRef.current?.focus();
  }, [card]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-2xl p-6 bg-card rounded-lg shadow-lg flex flex-col items-center focus:outline-none"
      tabIndex={-1} // Make the div focusable
      onKeyDown={handleKeyDown} // Attach the event handler here
    >
      {/* Question */}
      <p className="text-lg text-muted-foreground mb-6">{card.question}</p>
      
      {/* Visual Masked Input */}
      <div className="mb-8 w-full flex justify-center">
        <MaskedInput
          characterDetails={characterDetails}
          userInput={userInput}
          status={status}
          shakeCount={shake}
        />
      </div>

      {/* Action Buttons */}
      <div className="h-10 flex items-center gap-4">
        {status === 'typing' ? (
          <Button variant="ghost" onClick={handleShowAnswer}>Show Answer</Button>
        ) : status === 'correct' ? (
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => handleRate('good')}>Good (2)</Button>
            <Button variant="default" onClick={() => handleRate('easy')}>Easy (1)</Button>
          </div>
        ) : status === 'revealed' ? (
          <Button variant="destructive" onClick={() => handleRate('again')}>Again (1)</Button>
        ) : null}
      </div>
    </div>
  );
}