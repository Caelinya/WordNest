"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';

// --- Types ---
export type ReviewStatus = 'typing' | 'correct' | 'incorrect' | 'revealed';
export type ReviewMode = 'first-letter-hint' | 'length-hint' | 'translation-recall';

export interface FlashcardData {
  id: number;
  question: string;
  answer: string;
  mode: ReviewMode;
}

export interface CharacterDetail {
  type: 'letter' | 'whitespace';
  originalChar: string;
  isHint: boolean;
}

// --- Constants ---
const ERROR_THRESHOLD = 3; // Number of allowed mistakes

// --- The Hook ---
export function useFlashcard(card: FlashcardData, onCompleted: (rating: 'again' | 'good' | 'easy') => void) {
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('typing');
  const [errorCount, setErrorCount] = useState(0);
  
  // A state to trigger animations on incorrect input
  const [shake, setShake] = useState(0); 

  // 1. Pre-process the answer into a detailed character map
  const characterDetails = useMemo<CharacterDetail[]>(() => {
    const sanitizedAnswer = card.answer.trim();
    return sanitizedAnswer.split('').map((char, index) => {
      if (/\s/.test(char)) {
        return { type: 'whitespace', originalChar: ' ', isHint: false };
      }
      const isHint = card.mode === 'first-letter-hint' && (index === 0 || /\s/.test(sanitizedAnswer[index - 1] || ' '));
      return { type: 'letter', originalChar: char, isHint };
    });
  }, [card]);
  
  const answer = useMemo(() => characterDetails.map(c => c.originalChar).join(''), [characterDetails]);
  const sanitizedUserInput = userInput; // We now handle spaces directly


  // 2. Unified keyboard event handler, now returned to be used in the component
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    console.log(`--- KeyDown Event ---`);
    console.log(`Key: ${e.key}, Status: ${status}`);

    // Always prevent default for the keys we handle to avoid side effects
    
    // --- Handle Rating ---
    if (status === 'correct' || status === 'revealed') {
      console.log('Action: Rating');
      e.preventDefault();
      if (e.key === 'Enter' || e.key === '1') {
        onCompleted(status === 'correct' ? 'easy' : 'again');
      } else if (e.key === '2') {
        onCompleted('good');
      }
      return;
    }

    // --- Handle Typing ---
    if (status === 'typing') {
      console.log('Action: Typing');
      // Handle Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        let tempInput = userInput.slice(0, -1);
        while (tempInput.length > 0 && characterDetails[tempInput.length - 1]?.type === 'whitespace') {
            tempInput = tempInput.slice(0, -1);
        }
        setUserInput(tempInput);
        return;
      }

      // Handle single character input
      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) { // Only allow letters
          e.preventDefault();
          let nextCharIndex = userInput.length;
          while(characterDetails[nextCharIndex]?.type === 'whitespace') {
              nextCharIndex++;
          }
          
          if (nextCharIndex >= characterDetails.length) return;

          const expectedChar = characterDetails[nextCharIndex].originalChar;

          if (e.key.toLowerCase() === expectedChar.toLowerCase()) {
              const correctPrefix = answer.substring(0, nextCharIndex + 1);
              console.log('Input Correct. New userInput:', correctPrefix);
              setUserInput(correctPrefix);
              if (correctPrefix.toLowerCase() === answer.toLowerCase()) {
                  console.log('Status change: -> correct');
                  setStatus('correct');
              }
          } else {
              const newErrorCount = errorCount + 1;
              console.log('Input Incorrect. Error count:', newErrorCount);
              setErrorCount(newErrorCount);
              setShake(s => s + 1);
              if (newErrorCount >= ERROR_THRESHOLD) {
                  console.log('Status change: -> revealed');
                  setStatus('revealed');
                  setUserInput(answer);
              }
          }
      }
    }
  }, [status, userInput, answer, errorCount, characterDetails, onCompleted]);
  
  // 3. Handle rating submissions (for button clicks)
  const handleRate = useCallback((rating: 'again' | 'good' | 'easy') => {
    onCompleted(rating);
  }, [onCompleted]);

  // Handle "Show Answer"
  const handleShowAnswer = useCallback(() => {
    setStatus('revealed');
    setUserInput(answer);
  }, [answer]);

  return {
    // State
    userInput,
    status,
    characterDetails,
    shake,

    // Handlers
    handleKeyDown,
    handleRate,
    handleShowAnswer,
  };
}