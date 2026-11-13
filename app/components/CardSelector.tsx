'use client';

import { useState } from 'react';
import { tarotDeck } from '@/lib/data/tarot-deck';

interface CardSelectorProps {
  onSelectCard: (cardId: string, isReversed: boolean) => void;
}

export default function CardSelector({ onSelectCard }: CardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string>('all');

  const suites = [
    { value: 'all', label: 'All Cards' },
    { value: 'major', label: 'Major Arcana' },
    { value: 'cups', label: 'Cups' },
    { value: 'wands', label: 'Wands' },
    { value: 'swords', label: 'Swords' },
    { value: 'pentacles', label: 'Pentacles' },
  ];

  const filteredCards = tarotDeck.filter(card =>
    selectedSuite === 'all' ? true : card.suite === selectedSuite
  );

  const handleCardClick = (cardId: string, reversed: boolean) => {
    onSelectCard(cardId, reversed);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="sg-retro sg-secondary fixed bottom-6 right-6 px-7 py-3.5 z-50 font-light"
        
      >
        🎴 Pick Card
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-cream-50 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-cream-50 border-b border-forest-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-handwritten text-forest-900">Card Selector</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-3xl text-forest-600 hover:text-forest-800 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Suite Filter */}
          <div className="flex gap-2 flex-wrap">
            {suites.map(suite => (
              <button
                key={suite.value}
                onClick={() => setSelectedSuite(suite.value)}
                className={`px-4 py-2 rounded-full text-sm font-light transition-all ${
                  selectedSuite === suite.value
                    ? 'bg-forest-600 text-cream-50'
                    : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                }`}
              >
                {suite.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Grid */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCards.map(card => (
              <div key={card.id} className="space-y-2">
                {/* Upright */}
                <button
                  onClick={() => handleCardClick(card.id, false)}
                  className="w-full p-4 bg-white border-2 border-forest-200 rounded-xl hover:border-forest-500 hover:shadow-md transition-all text-left"
                >
                  <div className="text-lg font-light text-forest-900 mb-1">{card.name}</div>
                  <div className="text-xs text-forest-600 uppercase tracking-wider">
                    {card.suite} • Upright
                  </div>
                </button>

                {/* Reversed */}
                <button
                  onClick={() => handleCardClick(card.id, true)}
                  className="w-full p-4 bg-white border-2 border-clay-200 rounded-xl hover:border-clay-500 hover:shadow-md transition-all text-left"
                >
                  <div className="text-lg font-light text-clay-900 mb-1">{card.name}</div>
                  <div className="text-xs text-clay-600 uppercase tracking-wider">
                    {card.suite} • Reversed
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
