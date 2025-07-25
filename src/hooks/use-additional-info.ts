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
    setShowCard(false);
    localStorage.setItem('additional-info-dismissed', 'true');
  };

  const resetCard = () => {
    setShowCard(true);
    localStorage.removeItem('additional-info-dismissed');
  };

  return {
    showCard,
    dismissCard,
    resetCard,
  };
} 