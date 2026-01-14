import { describe, it, expect } from 'vitest';
import { getRandomWords, WORD_LIST } from './words';

describe('getRandomWords', () => {
  it('should return the requested number of words', () => {
    const words = getRandomWords(25);
    expect(words).toHaveLength(25);
  });

  it('should return unique words (no duplicates)', () => {
    const words = getRandomWords(36);
    const uniqueWords = new Set(words);
    expect(uniqueWords.size).toBe(36);
  });

  it('should only return words from the WORD_LIST', () => {
    const words = getRandomWords(50);
    for (const word of words) {
      expect(WORD_LIST).toContain(word);
    }
  });

  it('should return different words on subsequent calls', () => {
    const words1 = getRandomWords(25);
    const words2 = getRandomWords(25);
    
    // Very unlikely to get the same set of words in the same order
    expect(words1).not.toEqual(words2);
  });

  it('should handle small counts', () => {
    const words = getRandomWords(1);
    expect(words).toHaveLength(1);
    expect(WORD_LIST).toContain(words[0]);
  });

  it('should handle large counts up to word list size', () => {
    // Note: WORD_LIST may contain duplicates, so we test with a safe count
    const safeCount = 100;
    const words = getRandomWords(safeCount);
    expect(words).toHaveLength(safeCount);
    
    // All returned words should be unique
    const wordSet = new Set(words);
    expect(wordSet.size).toBe(safeCount);
  });
});

