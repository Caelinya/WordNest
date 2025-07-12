import { WordAnalysis } from "@/components/features/WordCard";
import { PhraseAnalysis } from "@/components/features/PhraseCard";
import { SentenceAnalysis } from "@/components/features/SentenceCard";

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Folder {
  id: number;
  name: string;
}

export interface Note {
  id: number;
  text: string;
  corrected_text?: string | null;
  type: "word" | "phrase" | "sentence";
  translation: WordAnalysis | PhraseAnalysis | SentenceAnalysis | null;
  tags: Tag[];
  folder_id?: number;
  folder?: Folder;
}

export interface User {
    id: number;
    username: string;
    email: string;
}

export interface PracticeList {
  id: number;
  name: string;
  description?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  item_count: number;
}

export interface PracticeListDetail extends PracticeList {
  items: PracticeListItem[];
}

export interface PracticeListItem {
  id: number;
  note_id: number;
  note: Note;
  order_index: number;
  added_at: string;
  review_count: number;
  last_reviewed?: string;
  mastery_level: number;
}

export interface PracticeListCreate {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface PracticeListUpdate {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface ReviewResult {
  rating: "again" | "good" | "easy";
}

// Essay Analysis Types
export interface EssayVersionSummary {
  id: number;
  version_number: number;
  total_score: number;
  max_score: number;
  created_at: string;
}

export interface Essay {
  id: number;
  title: string;
  question: string;
  type: "application" | "continuation";
  created_at: string;
  updated_at: string;
  owner_id: number;
  versions: EssayVersionSummary[];
}

export interface EssayVersion {
  id: number;
  version_number: number;
  content: string;
  scores: Record<string, ScoreDetail>;
  total_score: number;
  max_score: number;
  created_at: string;
  essay_id: number;
}

export interface ScoreDetail {
  score: number;
  max: number;
  grade: string;
  feedback: string;
}

export interface SuggestionCard {
  id: number;
  card_id: string;
  type: "vocabulary" | "language" | "rewrite";
  priority: "high" | "medium" | "low";
  data: Record<string, any>;
  applied: boolean;
  applied_at?: string;
  version_id: number;
}

export interface EssayAnalysisRequest {
  question: string;
  content: string;
  type: "application" | "continuation";
}

export interface EssayAnalysisResponse {
  scores: Record<string, ScoreDetail>;
  total_score: number;
  max_score: number;
  suggestion_cards: SuggestionCardData[];
}

export interface SuggestionCardData {
  card_id: string;
  type: "vocabulary" | "language" | "rewrite";
  priority: "high" | "medium" | "low";
  data: Record<string, any>;
}