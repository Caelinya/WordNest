import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, setTags, placeholder = "Add tags..." }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-full text-sm">
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="rounded-full hover:bg-background"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button type="button" onClick={addTag} variant="outline">
          Add
        </Button>
      </div>
    </div>
  );
}