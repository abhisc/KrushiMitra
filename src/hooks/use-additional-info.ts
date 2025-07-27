import { useState, useEffect } from 'react';

export function useAdditionalInfo() {
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the card
    const dismissed = localStorage.getItem('additional-info-dismissed');
    if (!dismissed) {
      setShowCard(true);
    }
  }, []);

  const dismissCard = () => {
    console.log('dismissCard called, setting showCard to false');
    setShowCard(false);
    localStorage.setItem('additional-info-dismissed', 'true');
  };

  const resetCard = () => {
    // Only reset if the card hasn't been dismissed
    const dismissed = localStorage.getItem('additional-info-dismissed');
    if (!dismissed) {
      setShowCard(true);
    }
  };

  const clearDismissal = () => {
    localStorage.removeItem('additional-info-dismissed');
    setShowCard(true);
  };

  return {
    showCard,
    dismissCard,
    resetCard,
    clearDismissal,
  };
} 