import React from "react";
import { Button } from "@/components/ui/button";

interface SessionCompleteProps {
  title: string;
  description: string;
  primaryButton: {
    text: string;
    onClick: () => void;
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
}

export const SessionComplete = React.memo(function SessionComplete({ 
  title, 
  description, 
  primaryButton, 
  secondaryButton 
}: SessionCompleteProps) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground mb-6">
        {description}
      </p>
      <div className="flex gap-4 justify-center">
        {secondaryButton && (
          <Button
            variant="outline"
            onClick={secondaryButton.onClick}
          >
            {secondaryButton.text}
          </Button>
        )}
        <Button onClick={primaryButton.onClick}>
          {primaryButton.text}
        </Button>
      </div>
    </div>
  );
});