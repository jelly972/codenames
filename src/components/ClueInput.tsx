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
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4"
    >
      <h3 className="text-sm font-medium text-[#9ca3af] mb-3">
        Give a Clue to Your Team
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value.replace(/\s/g, ''))}
            placeholder="One word clue..."
            className="input w-full"
            maxLength={30}
            autoFocus
            required
          />
          <p className="text-xs text-[#6b7280] mt-1">
            Must be a single word, no spaces
          </p>
        </div>

        <div className="w-24">
          <label className="block text-xs text-[#6b7280] mb-1">Count</label>
          <select
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="input w-full"
          >
            <option value={0}>∞ (unlimited)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={!word.trim() || isSubmitting}
            className="btn btn-primary"
          >
            Give Clue
          </button>
        </div>
      </div>
    </form>
  );
}

