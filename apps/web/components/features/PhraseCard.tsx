import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Type Definitions ---
interface Example {
  sentence: string;
  translation: string;
}

export interface PhraseAnalysis {
  explanation: string;
  translation: string;
  examples: Example[];
}

interface PhraseCardProps {
  data: PhraseAnalysis;
}

// --- Component ---
export function PhraseCard({ data }: PhraseCardProps) {
  return (
    <Accordion type="single" collapsible className="w-full mt-2">
      <AccordionItem value="item-0">
        <AccordionTrigger>
          <p className="font-semibold text-sm">{data.translation}</p>
        </AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground mb-4">{data.explanation}</p>
          <h4 className="font-semibold text-sm mb-2">Examples:</h4>
          <ul className="space-y-3">
            {data.examples.map((ex, exIndex) => (
              <li key={exIndex} className="text-sm">
                <p>{ex.sentence}</p>
                <p className="text-muted-foreground">{ex.translation}</p>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}