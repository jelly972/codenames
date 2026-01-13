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
    bg: '#1a0a1f',
    text: '#a855f7',
    border: '#a855f7',
  },
};

// Skull SVG icon for assassin cards
function SkullIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 3.69 2.47 6.86 6 8.25V22h8v-1.75c3.53-1.39 6-4.56 6-8.25 0-5.52-4.48-10-10-10zm-2 15h-1v-2h1v2zm0-4h-1v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1h-1v-1c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1v1zm6 4h-1v-2h1v2zm1-6c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm-6 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z"/>
    </svg>
  );
}

// X mark for assassin indicator
function CrosshairIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
    >
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  );
}

export function WordCard({
  word,
  index,
  isRevealed,
  cardType,
  spymasterCardType,
  canClick,
  onClick,
}: WordCardProps) {
  const isAssassin = spymasterCardType === 'assassin' || cardType === 'assassin';
  const isRevealedAssassin = isRevealed && cardType === 'assassin';

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
      
      // Special styling for assassin in spymaster view
      if (spymasterCardType === 'assassin') {
        return {
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderColor: '#a855f7',
          borderWidth: '3px',
          boxShadow: 'inset 0 0 20px rgba(168, 85, 247, 0.2)',
        };
      }
      
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
        ${isRevealedAssassin ? 'animate-pulse' : ''}
      `}
      style={style}
    >
      {/* Revealed assassin - full card X overlay */}
      {isRevealedAssassin && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CrosshairIcon className="w-full h-full text-purple-500 opacity-40 p-2" />
        </div>
      )}

      {/* Word text */}
      <span
        className={`
          relative z-10 text-xs sm:text-sm lg:text-base uppercase tracking-wide
          ${isRevealed && !isRevealedAssassin ? 'line-through opacity-70' : ''}
          ${isRevealedAssassin ? 'text-purple-400' : ''}
        `}
      >
        {word}
      </span>

      {/* Spymaster indicator - dot for teams, X for assassin */}
      {spymasterCardType && !isRevealed && (
        <>
          {spymasterCardType === 'assassin' ? (
            <div className="absolute top-1 right-1 w-5 h-5 text-purple-500">
              <CrosshairIcon className="w-full h-full" />
            </div>
          ) : (
            <div
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: CARD_STYLES[spymasterCardType].border }}
            />
          )}
        </>
      )}

      {/* Assassin label for spymaster view */}
      {spymasterCardType === 'assassin' && !isRevealed && (
        <span className="absolute bottom-1 left-1 text-[10px] uppercase tracking-wider text-purple-500 font-bold opacity-60">
          DEATH
        </span>
      )}
    </button>
  );
}
