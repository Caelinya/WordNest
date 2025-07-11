"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { practiceListsApi } from "@/lib/api";
import { PracticeListItem, PracticeList } from "@/types/notes";
import { Flashcard } from "@/components/features/review/Flashcard";
import { FlashcardData } from "@/hooks/use-flashcard";

export default function PracticeListReviewPage() {
  const params = useParams();
  const router = useRouter();
  const listId = Number(params.id);

  const [list, setList] = useState<PracticeList | null>(null);
  const [reviewQueue, setReviewQueue] = useState<PracticeListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const loadReviewData = useCallback(async () => {
    try {
      // Load list info and review queue in parallel
      const [listData, queueData] = await Promise.all([
        practiceListsApi.getById(listId),
        practiceListsApi.getReviewQueue(listId, 20)
      ]);
      
      setList(listData);
      setReviewQueue(queueData);
      
      if (queueData.length === 0) {
        setIsSessionComplete(true);
      }
    } catch {
      toast.error("Failed to load review data");
      router.push(`/practice-lists/${listId}`);
    } finally {
      setLoading(false);
    }
  }, [listId, router]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  const handleCompleted = async (rating: 'again' | 'good' | 'easy') => {
    const currentItem = reviewQueue[currentIndex];
    
    try {
      // Record the review result
      await practiceListsApi.recordReview(listId, currentItem.id, { rating });
      
      // Move to next card
      if (currentIndex + 1 >= reviewQueue.length) {
        setIsSessionComplete(true);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch {
      toast.error("Failed to record review result");
    }
  };

  const handleRestart = async () => {
    setCurrentIndex(0);
    setIsSessionComplete(false);
    setLoading(true);
    
    try {
      const queueData = await practiceListsApi.getReviewQueue(listId, 20);
      setReviewQueue(queueData);
      
      if (queueData.length === 0) {
        setIsSessionComplete(true);
      }
    } catch {
      toast.error("Failed to load review queue");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading review session...</p>
        </div>
      </div>
    );
  }

  // Convert PracticeListItem to FlashcardData format
  const currentCard: FlashcardData | null = reviewQueue[currentIndex] ? {
    id: reviewQueue[currentIndex].id,
    question: getQuestionText(reviewQueue[currentIndex]),
    answer: reviewQueue[currentIndex].note.corrected_text || reviewQueue[currentIndex].note.text,
    mode: determineReviewMode(reviewQueue[currentIndex]),
  } : null;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/practice-lists/${listId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {list?.name || "Practice List"} - Review Session
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentIndex + 1} / {reviewQueue.length} cards
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {isSessionComplete ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Session Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Great job! You've reviewed all available cards.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/practice-lists/${listId}`)}
              >
                Back to List
              </Button>
              <Button onClick={handleRestart}>
                Review Again
              </Button>
            </div>
          </div>
        ) : currentCard ? (
          <div className="w-full max-w-2xl">
            <Flashcard
              key={currentCard.id}
              card={currentCard}
              onCompleted={handleCompleted}
            />
            
            {/* Progress and stats */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Mastery Level: {reviewQueue[currentIndex].mastery_level}/5</p>
              {reviewQueue[currentIndex].review_count > 0 && (
                <p>Previous reviews: {reviewQueue[currentIndex].review_count}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground">No cards to review</p>
            <Button
              className="mt-4"
              onClick={() => router.push(`/practice-lists/${listId}`)}
            >
              Back to List
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to generate question text based on note type and translation
function getQuestionText(item: PracticeListItem): string {
  const note = item.note;
  
  if (!note.translation) {
    return `Translate: ${note.text}`;
  }
  
  // Extract Chinese translation based on note type
  switch (note.type) {
    case "word":
      const wordData = note.translation as unknown as Record<string, unknown>;
      return `中文：${(wordData.translation as string) || (wordData.chinese as string) || "请翻译"}`;

    case "phrase":
      const phraseData = note.translation as unknown as Record<string, unknown>;
      return `中文：${(phraseData.translation as string) || (phraseData.chinese as string) || "请翻译"}`;

    case "sentence":
      const sentenceData = note.translation as unknown as Record<string, unknown>;
      return `中文：${(sentenceData.translation as string) || (sentenceData.chinese as string) || "请翻译"}`;

    default:
      return `Translate: ${note.text}`;
  }
}

// Helper function to determine review mode based on mastery level
function determineReviewMode(item: PracticeListItem): 'first-letter-hint' | 'length-hint' | 'translation-recall' {
  // Lower mastery = more hints
  if (item.mastery_level <= 1) {
    return 'first-letter-hint';
  } else if (item.mastery_level <= 3) {
    return 'length-hint';
  } else {
    return 'translation-recall';
  }
}