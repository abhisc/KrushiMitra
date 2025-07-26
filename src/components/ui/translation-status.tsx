'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { getTranslationCacheStats } from '@/utils/language';
import { Globe, CheckCircle, Clock, Zap } from 'lucide-react';

export const TranslationStatus: React.FC = () => {
  const { currentLanguage, isTranslating } = useLanguage();
  const [cacheStats, setCacheStats] = useState({ size: 0, hitRate: 0 });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const stats = getTranslationCacheStats();
      setCacheStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (currentLanguage === 'en') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {isTranslating ? 'AI Translating...' : 'Translation Ready'}
          </span>
          {isTranslating && <Zap className="w-3 h-3 animate-pulse text-yellow-500" />}
        </div>
        
        {showStats && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Cache: {cacheStats.size} items</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>Hit Rate: {(cacheStats.hitRate * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowStats(!showStats)}
          className="mt-1 text-xs text-blue-600 hover:text-blue-800"
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
      </div>
    </div>
  );
}; 