'use client';

import { useEffect, useState } from 'react';
import { TarotCard as TarotCardType } from '@/lib/types/tarot';
import { getActiveMeaning, getActiveKeywords, formatSuite } from '@/lib/utils/card-utils';
import { getCardIcon } from './card-icons';

interface CardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  cardId: string;
  isReversed: boolean;
  reflection?: string;
  onReflectionChange: (value: string) => void;
}

export default function CardDrawer({
  isOpen,
  onClose,
  date,
  cardId,
  isReversed,
  reflection,
  onReflectionChange,
}: CardDrawerProps) {
  const [card, setCard] = useState<TarotCardType | null>(null);

  useEffect(() => {
    // Load the card data
    const loadCard = async () => {
      try {
        const response = await fetch('/api/daily-card');
        const data = await response.json();
        // Find the specific card from the deck
        // For now, we'll use the same endpoint but in production you'd want to load by ID
        setCard(data.card);
      } catch (error) {
        console.error('Failed to load card:', error);
      }
    };

    if (isOpen && cardId) {
      loadCard();
    }
  }, [isOpen, cardId]);

  if (!isOpen || !card) return null;

  const activeMeaning = getActiveMeaning(card, isReversed);
  const activeKeywords = getActiveKeywords(card, isReversed);
  const CardIcon = getCardIcon(cardId);

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 bg-cream-50 rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto transform transition-transform duration-300 ease-out">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-forest-300 rounded-full" />
        </div>

        <div className="px-6 pb-8">
          {/* Date */}
          <div className="text-center mb-6">
            <p className="text-forest-600 text-lg font-light">
              {formattedDate}
            </p>
          </div>

          {/* Mini Card */}
          <div className="w-48 h-72 mx-auto mb-6 bg-cream-50 rounded-2xl flex flex-col items-center justify-center border-2 border-forest-300 shadow-md">
            <div className={`text-center w-full p-6 ${isReversed ? 'rotate-180' : ''}`}>
              {/* Card icon */}
              <div className="w-32 h-32 mx-auto mb-3 text-forest-700">
                {CardIcon ? <CardIcon /> : (
                  <div className="w-full h-full rounded-full border-2 border-forest-400 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-forest-300/40"></div>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-light text-forest-900 mb-1">{card.name}</h3>
              <p className="text-forest-600 text-xs uppercase tracking-widest">{formatSuite(card.suite)}</p>
            </div>
          </div>

          {/* Orientation Badge */}
          <div className="flex justify-center mb-6">
            <span className={`
              px-4 py-1 rounded-full text-xs font-light tracking-wider uppercase
              ${isReversed
                ? 'bg-clay-100 text-clay-700 border border-clay-300'
                : 'bg-sage-100 text-sage-700 border border-sage-300'
              }
            `}>
              {isReversed ? 'Reversed' : 'Upright'}
            </span>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {activeKeywords.slice(0, 5).map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-forest-100 text-forest-800 rounded-full text-sm border border-forest-400 font-light"
              >
                {keyword}
              </span>
            ))}
          </div>

          {/* Meaning */}
          <div className="mb-6">
            <h4 className="text-2xl font-light text-forest-900 mb-3">meaning</h4>
            <p className="text-forest-700 leading-relaxed text-lg font-light">{activeMeaning}</p>
          </div>

          {/* Reflection */}
          <div>
            <h4 className="text-2xl font-light text-forest-900 mb-3">reflection</h4>
            <textarea
              className="w-full h-32 bg-cream-100 text-forest-800 border border-forest-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none font-light text-base leading-relaxed"
              placeholder="write whatever is here..."
              onChange={(e) => onReflectionChange(e.target.value)}
              defaultValue={reflection || ''}
            />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full mt-6 py-3 bg-forest-600 hover:bg-forest-700 text-cream-50 font-light rounded-full transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
