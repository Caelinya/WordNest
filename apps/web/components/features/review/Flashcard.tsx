"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MaskedInput } from './MaskedInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ReviewStatus = 'pristine' | 'typing' | 'correct' | 'incorrect' | 'revealed';
type ReviewMode = 'first-letter-hint' | 'length-hint' | 'translation-recall' | 'ai-cloze';

export interface FlashcardData {
  id: number;
  question: string;
  answer: string;
  mode: ReviewMode;
}

interface FlashcardProps {
  card: FlashcardData;
  onCompleted: (rating: 'again' | 'good' | 'easy') => void;
}

export function Flashcard({ card, onCompleted }: FlashcardProps) {
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('pristine');
  const [attemptCount, setAttemptCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [forgivingHintMode] = useState(true);
  const [hintFlashIndex, setHintFlashIndex] = useState<number | null>(null);
  const [hintShakeIndex, setHintShakeIndex] = useState<number | null>(null);

  const { fullAnswer, answerMap, visualHintMap } = useMemo(() => {
    const sanitizedAnswer = card.answer.replace(/\s/g, '').toLowerCase();
    const aMap = new Map<number, { char: string, isHint: boolean, visualIndex: number }>();
    const vMap = new Map<number, string>();
    
    let nonSpaceIndex = 0;
    for (let i = 0; i < card.answer.length; i++) {
        const char = card.answer[i];
        if (/\s/.test(char)) continue;

        const isHint = card.mode === 'first-letter-hint' && (i === 0 || /\s/.test(card.answer[i - 1]));
        
        aMap.set(nonSpaceIndex, { char: char.toLowerCase(), isHint, visualIndex: nonSpaceIndex });
        if(isHint) {
            vMap.set(nonSpaceIndex, char.toLowerCase());
        }
        nonSpaceIndex++;
    }

    return {
      fullAnswer: sanitizedAnswer,
      answerMap: aMap,
      visualHintMap: vMap
    };
  }, [card]);

  useEffect(() => {
    inputRef.current?.focus();
    setUserInput('');
    setStatus('pristine');
    setAttemptCount(0);
  }, [card]);
  
  useEffect(() => {
    if (status !== 'typing' || card.mode === 'translation-recall') return;
    if (userInput.length >= fullAnswer.length) {
      handleCheck();
    }
  }, [userInput, fullAnswer, card.mode]);
  useEffect(() => {
    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (status === 'correct') {
          onCompleted('easy');
        } else if (status === 'revealed') {
          onCompleted('again');
        }
      }
    };

    if (status === 'correct' || status === 'revealed') {
      window.addEventListener('keydown', handleEnterKey);
    }

    return () => {
      window.removeEventListener('keydown', handleEnterKey);
    };
  }, [status, onCompleted]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'correct' || status === 'revealed') return;
    
    const newValue = e.target.value;

    // Handle deletion - this is now the simplest possible logic.
    if (newValue.length < userInput.length) {
        setUserInput(newValue);
        setStatus('typing');
        return;
    }

    // Handle addition
    const typedChar = newValue.slice(-1).toLowerCase();
    const currentPos = userInput.length;
    const currentAnswerInfo = answerMap.get(currentPos);
    
    if (forgivingHintMode && currentAnswerInfo?.isHint) {
      if (typedChar === currentAnswerInfo.char) {
        // Correct hint typed. Flash and add ONLY this char.
        setHintFlashIndex(currentAnswerInfo.visualIndex);
        setUserInput(userInput + typedChar);
      } else {
        // Incorrect hint typed. Shake and do nothing.
        setHintShakeIndex(currentAnswerInfo.visualIndex);
      }
      return;
    }
    
    const sanitizedNewValue = card.mode === 'translation-recall' ? newValue : newValue.replace(/\s/g, '');
    setStatus('typing');
    setUserInput(sanitizedNewValue);
  };

  const handleCheck = () => {
    const isCorrect = userInput.toLowerCase() === fullAnswer;
    if (isCorrect) {
      setStatus('correct');
    } else {
      setAttemptCount(prev => prev + 1);
      if (attemptCount >= 1) {
        setStatus('revealed');
      } else {
        setStatus('incorrect');
        setTimeout(() => {
          setUserInput('');
          setStatus('pristine');
          inputRef.current?.focus();
        }, 1000);
      }
    }
  };
  
  const renderInputArea = () => {
    if (card.mode === 'translation-recall') {
      return (
        <div className="w-full">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="Type your answer..."
              className="text-center text-lg"
            />
        </div>
      );
    }
    return (
      <>
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          className="opacity-0 w-0 h-0 p-0 m-0 border-0"
          maxLength={fullAnswer.length}
          autoFocus
        />
        <MaskedInput
          answer={card.answer}
          userInput={userInput}
          status={status}
          visualHintMap={visualHintMap}
          hintFlashIndex={hintFlashIndex}
          hintShakeIndex={hintShakeIndex}
          onAnimationComplete={handleAnimationComplete}
        />
      </>
    );
  }

  const handleShowAnswer = () => {
    setStatus('revealed');
    setUserInput(fullAnswer);
  };

  const handleAnimationComplete = () => {
    if (hintFlashIndex !== null) setHintFlashIndex(null);
    if (hintShakeIndex !== null) setHintShakeIndex(null);
  };

  return (
    <div 
      className="w-full max-w-2xl p-6 bg-card rounded-lg shadow-lg flex flex-col items-center"
      onClick={() => inputRef.current?.focus()}
    >
      <p className="text-lg text-muted-foreground mb-6">{card.question}</p>

      <div className="mb-8 w-full flex justify-center">
        {renderInputArea()}
      </div>

      <div className="h-10 flex items-center gap-4">
        {status === 'pristine' || status === 'typing' || status === 'incorrect' ? (
          <>
            <Button variant="ghost" onClick={handleShowAnswer}>Show Answer</Button>
            {card.mode === 'translation-recall' && <Button onClick={handleCheck}>Check</Button>}
          </>
        ) : status === 'correct' ? (
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => onCompleted('good')}>Good</Button>
            <Button variant="default" onClick={() => onCompleted('easy')}>Easy</Button>
          </div>
        ) : status === 'revealed' ? (
          <Button variant="destructive" onClick={() => onCompleted('again')}>Again</Button>
        ) : null}
      </div>
    </div>
  );
}