'use client';

import { useState } from 'react';

interface ClueInputProps {
  onSubmit: (word: string, count: number) => void;
}

export function ClueInput({ onSubmit }: ClueInputProps) {
  const [word, setWord] = useState('');
  const [count, setCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedWord = word.trim();
    if (!trimmedWord) return;

    setIsSubmitting(true);
    onSubmit(trimmedWord, count);
    
    // Reset form
    setWord('');
    setCount(1);
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-2 sm:p-4"
    >
      <h3 className="text-xs sm:text-sm font-medium text-[#9ca3af] mb-2 sm:mb-3">
        Give a Clue
      </h3>
      
      <div className="flex flex-row gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value.replace(/\s/g, ''))}
            placeholder="One word..."
            className="input w-full text-sm sm:text-base py-1.5 sm:py-2"
            maxLength={30}
            autoFocus
            required
          />
        </div>

        <div className="w-16 sm:w-24 shrink-0">
          <select
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="input w-full text-sm sm:text-base py-1.5 sm:py-2"
            aria-label="Count"
          >
            <option value={0}>∞</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="shrink-0">
          <button
            type="submit"
            disabled={!word.trim() || isSubmitting}
            className="btn btn-primary py-1.5 px-2 sm:py-2 sm:px-4 text-sm"
          >
            <span className="hidden sm:inline">Give</span> Clue
          </button>
        </div>
      </div>
    </form>
  );
}

