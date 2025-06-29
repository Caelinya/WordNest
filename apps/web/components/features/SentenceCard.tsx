import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TagBadge } from "../ui/TagBadge";


// --- Type Definitions ---
export interface SentenceAnalysis {
  translation: string;
  keywords: string[];
  grammar_analysis: string;
}

interface SentenceCardProps {
  data: SentenceAnalysis;
}

// --- Component ---
export function SentenceCard({ data }: SentenceCardProps) {
  return (
    <div className="mt-2 space-y-4">
      <blockquote className="border-l-2 pl-6 italic">
        {data.translation}
      </blockquote>

      <div>
        <h4 className="font-semibold text-sm mb-2">Keywords:</h4>
        <div className="flex flex-wrap gap-2">
            {data.keywords.map((keyword, index) => (
                <TagBadge key={index} name={keyword} color="#808080" />
            ))}
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-0">
          <AccordionTrigger>
            <p className="font-semibold text-sm">Grammar Analysis</p>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {data.grammar_analysis}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}