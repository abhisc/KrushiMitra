"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationHistory {
  path: string;
  timestamp: number;
}

export function useNavigationHistory() {
  const pathname = usePathname();
  const historyRef = useRef<NavigationHistory[]>([]);
  const maxHistoryLength = 10; // Keep last 10 pages

  useEffect(() => {
    // Add current path to history
    const currentPath: NavigationHistory = {
      path: pathname || '/',
      timestamp: Date.now()
    };

    // Don't add if it's the same as the last entry
    if (historyRef.current.length === 0 || 
        historyRef.current[historyRef.current.length - 1].path !== currentPath.path) {
      historyRef.current.push(currentPath);
      
      // Keep only the last N entries
      if (historyRef.current.length > maxHistoryLength) {
        historyRef.current = historyRef.current.slice(-maxHistoryLength);
      }
    }
  }, [pathname]);

  const getPreviousPath = (): string | null => {
    const history = historyRef.current;
    if (history.length < 2) {
      return null;
    }
    
    // Get the second-to-last entry (previous page)
    return history[history.length - 2].path;
  };

  const getNavigationHistory = (): NavigationHistory[] => {
    return [...historyRef.current];
  };

  const clearHistory = () => {
    historyRef.current = [];
  };

  return {
    getPreviousPath,
    getNavigationHistory,
    clearHistory,
    currentPath: pathname
  };
} 