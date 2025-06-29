import { WordAnalysis } from "@/components/features/WordCard";
import { PhraseAnalysis } from "@/components/features/PhraseCard";
import { SentenceAnalysis } from "@/components/features/SentenceCard";

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Note {
  id: number;
  text: string;
  type: "word" | "phrase" | "sentence";
  translation: WordAnalysis | PhraseAnalysis | SentenceAnalysis | null;
  tags: Tag[];
}