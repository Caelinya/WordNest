"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Upload } from 'lucide-react';
import { ImportReviewer } from './ImportReviewer';

export function ImportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState<string[]>([]);
  const [isReviewerOpen, setIsReviewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/parser/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.items && response.data.items.length > 0) {
        setExtractedItems(response.data.items);
        setIsReviewerOpen(true);
        toast.success(`Successfully extracted ${response.data.items.length} items from ${file.name}`);
      } else {
        toast.info("No learning items were found in the document.");
      }
    } catch (error) {
      // The global error handler in api.ts will show a toast
      console.error("Upload failed", error);
    } finally {
      setIsLoading(false);
      // Reset the file input so the same file can be selected again
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.pptx,.txt,.md"
        disabled={isLoading}
      />
      <Button type="button" onClick={handleButtonClick} disabled={isLoading} variant="outline" size="sm">
        <Upload className="mr-2 h-4 w-4" />
        {isLoading ? 'Analyzing...' : 'Import Document'}
      </Button>

      <ImportReviewer
        items={extractedItems}
        open={isReviewerOpen}
        onOpenChange={setIsReviewerOpen}
      />
    </>
  );
}