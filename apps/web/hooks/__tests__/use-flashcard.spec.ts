import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlashcard, FlashcardData } from '../use-flashcard';

// --- Helper to simulate keydown events ---
const fireKeydown = (result: any, key: string) => {
    act(() => {
        result.current.handleKeyDown({
            key,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as React.KeyboardEvent);
    });
};

// --- Mock Data ---
const mockCardSimple: FlashcardData = {
  id: 1,
  question: 'Q1',
  answer: 'test',
  mode: 'length-hint',
};

const mockCardWithHint: FlashcardData = {
  id: 2,
  question: 'Q2',
  answer: 'React Hook',
  mode: 'first-letter-hint',
};

const mockCardNew: FlashcardData = {
    id: 3,
    question: 'Q3',
    answer: 'new',
    mode: 'length-hint',
};


describe('useFlashcard', () => {
  it('should initialize with default state', () => {
    const onCompleted = vi.fn();
    const { result } = renderHook(() => useFlashcard(mockCardSimple, onCompleted));

    expect(result.current.userInput).toBe('');
    expect(result.current.status).toBe('typing');
  });

  it('should handle a correct input sequence and update status to "correct"', () => {
    const { result } = renderHook(() => useFlashcard(mockCardSimple, vi.fn()));

    fireKeydown(result, 't');
    fireKeydown(result, 'e');
    fireKeydown(result, 's');
    
    expect(result.current.status).toBe('typing');
    expect(result.current.userInput).toBe('tes');

    fireKeydown(result, 't');

    expect(result.current.userInput).toBe('test');
    expect(result.current.status).toBe('correct');
  });

  it('should handle incorrect input and increment error count', () => {
    const { result } = renderHook(() => useFlashcard(mockCardSimple, vi.fn()));

    fireKeydown(result, 'x');

    expect(result.current.userInput).toBe('');
    expect(result.current.shake).toBe(1);
    
    fireKeydown(result, 't');
    expect(result.current.userInput).toBe('t');
  });

  it('should reveal the answer after reaching the error threshold', () => {
    const { result } = renderHook(() => useFlashcard(mockCardSimple, vi.fn()));

    fireKeydown(result, 'x'); // Error 1
    fireKeydown(result, 'y'); // Error 2
    fireKeydown(result, 'z'); // Error 3

    expect(result.current.status).toBe('revealed');
    expect(result.current.userInput).toBe('test');
  });

  it('should handle Backspace correctly', () => {
    const { result } = renderHook(() => useFlashcard(mockCardWithHint, vi.fn()));

    fireKeydown(result, 'R');
    fireKeydown(result, 'e');
    expect(result.current.userInput).toBe('Re');

    fireKeydown(result, 'Backspace');
    expect(result.current.userInput).toBe('R');
    
    fireKeydown(result, 'e');
    fireKeydown(result, 'a');
    fireKeydown(result, 'c');
    fireKeydown(result, 't');
    // Skips space
    fireKeydown(result, 'H');
    expect(result.current.userInput).toBe('React H');
    
    fireKeydown(result, 'Backspace');
    expect(result.current.userInput).toBe('React'); // Should trim the space
  });

  it('should call onCompleted with rating keys when status is correct/revealed', () => {
    const onCompleted = vi.fn();
    const { result } = renderHook(() => useFlashcard(mockCardSimple, onCompleted));

    // Get to correct state
    "test".split('').forEach(key => fireKeydown(result, key));
    expect(result.current.status).toBe('correct');
    
    // Test rating keys
    fireKeydown(result, 'Enter');
    expect(onCompleted).toHaveBeenCalledWith('easy');
    expect(onCompleted).toHaveBeenCalledTimes(1);
    
    fireKeydown(result, '2');
    expect(onCompleted).toHaveBeenCalledWith('good');
  });
});