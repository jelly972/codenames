import { describe, it, expect } from 'vitest';
import { getRandomHebrewWords, WORD_LIST_HE } from './words-he';

describe('WORD_LIST_HE', () => {
  it('should not contain any duplicate words', () => {
    const uniqueWords = new Set(WORD_LIST_HE);
    expect(uniqueWords.size).toBe(WORD_LIST_HE.length);
  });

  it('should have a reasonable number of words for the game', () => {
    // Need at least 36 words for a large (6x6) board
    expect(WORD_LIST_HE.length).toBeGreaterThanOrEqual(36);
    // Should have plenty of variety
    expect(WORD_LIST_HE.length).toBeGreaterThan(400);
  });
});

describe('getRandomHebrewWords', () => {
  it('should return the requested number of words', () => {
    const words = getRandomHebrewWords(25);
    expect(words).toHaveLength(25);
  });

  it('should return unique words (no duplicates)', () => {
    const words = getRandomHebrewWords(36);
    const uniqueWords = new Set(words);
    expect(uniqueWords.size).toBe(36);
  });

  it('should only return words from the WORD_LIST_HE', () => {
    const words = getRandomHebrewWords(50);
    for (const word of words) {
      expect(WORD_LIST_HE).toContain(word);
    }
  });

  it('should return different words on subsequent calls', () => {
    const words1 = getRandomHebrewWords(25);
    const words2 = getRandomHebrewWords(25);
    
    // Very unlikely to get the same set of words in the same order
    expect(words1).not.toEqual(words2);
  });

  it('should handle small counts', () => {
    const words = getRandomHebrewWords(1);
    expect(words).toHaveLength(1);
    expect(WORD_LIST_HE).toContain(words[0]);
  });

  it('should handle the full word list size', () => {
    const words = getRandomHebrewWords(WORD_LIST_HE.length);
    expect(words).toHaveLength(WORD_LIST_HE.length);
    
    // Should contain all unique words from the list
    const wordSet = new Set(words);
    expect(wordSet.size).toBe(WORD_LIST_HE.length);
  });
});

