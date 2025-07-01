"use client";

import React, { useState } from 'react';
import { Flashcard, FlashcardData } from './Flashcard';
import { Button } from '@/components/ui/button';

// --- Hardcoded Demo Data ---
const mockReviewQueue: FlashcardData[] = [
  {
    id: 1,
    question: "中文：普遍存在的",
    answer: "ubiquitous",
    mode: 'first-letter-hint',
  },
  {
    id: 2,
    question: "中文：一个很简单的事",
    answer: "a piece of cake",
    mode: 'length-hint',
  },
  {
    id: 3,
    question: "中文：苹果",
    answer: "apple",
    mode: 'length-hint',
  },
    {
    id: 4,
    question: "中文：一个很简单的事",
    answer: "a piece of cake",
    mode: 'first-letter-hint',
  },
];


export function ReviewSession() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const handleCompleted = (rating: 'again' | 'good' | 'easy') => {
    console.log(`Card ${mockReviewQueue[currentIndex].id} rated as ${rating}`);
    
    if (currentIndex + 1 >= mockReviewQueue.length) {
      setIsSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsSessionComplete(false);
  }

  const currentCard = mockReviewQueue[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] p-4">
      {isSessionComplete ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session Complete!</h2>
          <p className="text-muted-foreground mb-6">You have reviewed all cards for now.</p>
          <Button onClick={handleRestart}>Review Again</Button>
        </div>
      ) : (
        <Flashcard card={currentCard} onCompleted={handleCompleted} />
      )}
    </div>
  );
}