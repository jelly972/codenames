'use client';

import { CardType, TEAM_COLORS } from '@/types/game';

interface WordCardProps {
  word: string;
  index: number;
  isRevealed: boolean;
  cardType: CardType | null;
  spymasterCardType: CardType | null;
  canClick: boolean;
  onClick: () => void;
}

const CARD_STYLES: Record<CardType, { bg: string; text: string; border: string }> = {
  red: {
    bg: 'var(--team-red)',
    text: '#ffffff',
    border: 'var(--team-red)',
  },
  blue: {
    bg: 'var(--team-blue)',
    text: '#ffffff',
    border: 'var(--team-blue)',
  },
  green: {
    bg: 'var(--team-green)',
    text: '#ffffff',
    border: 'var(--team-green)',
  },
  yellow: {
    bg: 'var(--team-yellow)',
    text: '#ffffff',
    border: 'var(--team-yellow)',
  },
  neutral: {
    bg: 'var(--team-neutral)',
    text: '#ffffff',
    border: 'var(--team-neutral)',
  },
  assassin: {
    bg: 'var(--team-assassin)',
    text: 'var(--team-assassin-accent)',
    border: 'var(--team-assassin-accent)',
  },
};

export function WordCard({
  word,
  index,
  isRevealed,
  cardType,
  spymasterCardType,
  canClick,
  onClick,
}: WordCardProps) {
  // Get styles based on card state
  const getCardStyle = () => {
    if (isRevealed && cardType) {
      const style = CARD_STYLES[cardType];
      return {
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      };
    }

    // Spymaster view - show hint of card type
    if (spymasterCardType) {
      const style = CARD_STYLES[spymasterCardType];
      return {
        backgroundColor: 'var(--card-bg)',
        borderColor: style.border,
        borderWidth: '3px',
      };
    }

    // Default unrevealed card
    return {
      backgroundColor: 'var(--card-bg)',
      borderColor: 'var(--card-border)',
    };
  };

  const style = getCardStyle();

  return (
    <button
      onClick={onClick}
      disabled={!canClick || isRevealed}
      className={`
        word-card relative aspect-[4/3] lg:aspect-[3/2] rounded-lg border-2 p-2 lg:p-3
        flex items-center justify-center text-center font-bold
        transition-all duration-200
        ${isRevealed ? 'revealed opacity-80' : ''}
        ${canClick && !isRevealed ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
        ${!canClick && !isRevealed ? 'disabled' : ''}
      `}
      style={style}
    >
      <span
        className={`
          text-xs sm:text-sm lg:text-base uppercase tracking-wide
          ${isRevealed ? 'line-through opacity-70' : ''}
        `}
      >
        {word}
      </span>

      {/* Spymaster indicator dot */}
      {spymasterCardType && !isRevealed && (
        <div
          className="absolute top-1 right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: CARD_STYLES[spymasterCardType].border }}
        />
      )}

      {/* Assassin skull */}
      {isRevealed && cardType === 'assassin' && (
        <span className="absolute bottom-1 right-1 text-lg">💀</span>
      )}
    </button>
  );
}

