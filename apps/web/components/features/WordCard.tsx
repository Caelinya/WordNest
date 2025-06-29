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

interface Definition {
  part_of_speech: string;
  translation: string;
  explanation: string;
  examples: Example[];
}

export interface WordAnalysis {
  phonetic?: string | null;
  definitions: Definition[];
}

interface WordCardProps {
  data: WordAnalysis;
}

// --- Component ---
export function WordCard({ data }: WordCardProps) {
  return (
    <div className="mt-2">
      <Accordion type="single" collapsible className="w-full">
        {data.definitions.map((def, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold">{def.part_of_speech}</span>
                <span>{def.translation}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground mb-4">{def.explanation}</p>
              <ul className="space-y-3">
                {def.examples.map((ex, exIndex) => (
                  <li key={exIndex} className="text-sm">
                    <p>{ex.sentence}</p>
                    <p className="text-muted-foreground">{ex.translation}</p>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}