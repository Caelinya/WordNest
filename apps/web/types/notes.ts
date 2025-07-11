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