'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { preloadCommonTranslations } from '@/utils/language';

// Common texts that appear frequently across the application
const COMMON_TEXTS = [
  // Navigation
  'Home', 'Diagnose', 'Market', 'Marketplace', 'Schemes', 'Weather', 'Plan', 'History', 'Farm Journal', 'CropCashFlow', 'Expert Connect', 'Profile',
  
  // Form labels
  'Product Type', 'Location', 'Crop', 'Budget Range', 'Additional Requirements', 'Search Products', 'Clear All', 'Submit', 'Cancel', 'Save', 'Delete', 'Edit',
  
  // Placeholders
  'Select product type', 'Select location', 'Select crop', 'Enter custom location', 'e.g., Mahindra, John Deere, Urea', 'e.g., ₹5,00,000 - ₹7,00,000', 'e.g., Govt certified, delivery available, organic',
  
  // Buttons
  'Search', 'Searching...', 'Analyzing Weather...', 'Get Weather & Irrigation Tips', 'Use My Location', 'Locating...', 'View Details', 'Buy Now', 'Contact Seller',
  
  // Headers
  'Agricultural Marketplace', 'Find tractors, fertilizers, seeds, and farming equipment', 'Weather & Irrigation Tips', 'Get weather forecasts and irrigation recommendations for your crops',
  'Crop Management', 'Marketplace & Financial Services', 'My Farm Journal', 'Log daily activities, track inputs, and view your farm\'s history and insights.',
  
  // Tool descriptions
  'Crop Growth Process Advisor', 'Track crop lifecycle and get intelligent farming suggestions',
  'Instant Crop Disease Diagnosis', 'Detect diseases from crop images using AI',
  'Profitability Calculator & Finance Manager', 'Analyze costs and profits for your farm operations',
  'Farming Marketplace', 'Buy and sell farming products from verified vendors',
  'Community Commerce (P2P Trading)', 'Trade tools and produce with nearby farmers',
  'Real-Time Market Insights', 'Get live market prices and future price forecasts',
  
  // Quick prompts
  'Check price of tomato', 'My wheat crop looks yellow', 'Show fertilizer subsidies', 'Weather forecast for crops', 'Pest control for rice',
  'Quick prompts to get started:',
  
  // Product types
  'Tractors & Farm Equipment', 'Fertilizers & Nutrients', 'Seeds & Planting Material', 'Pesticides & Crop Protection', 'Farm Tools & Implements',
  
  // Seller types
  'Krushi Kendra (Govt)', 'Local Dealer', 'Authorized Distributor',
  
  // Status messages
  'No recent chats', 'Advanced', 'Basic', 'No products found for your search criteria. Try adjusting your search parameters.',
  'Found products for your search', 'Search Complete', 'Search Failed', 'Unable to search marketplace. Please try again.',
  
  // Error messages
  'Error', 'Success', 'Please provide a location for weather analysis.', 'Please select a crop for weather analysis.',
  'Failed to get response from KrushiMitra. Please try again.', 'Sorry, I encountered an error. Please try again.',
  
  // Additional info
  'Additional information saved successfully!', 'Additional Information', 'Please provide additional information to help us serve you better.',
  
  // Weather analysis
  'Weather Analysis Parameters', 'Custom Location (Optional)', 'Enter custom location',
  
  // Marketplace
  'Search Summary', 'Back to Search', 'Search Criteria', 'New Search', 'Quick Search Examples',
  'Click any example below to quickly search for popular products:',
  
  // Product details
  'Product Details', 'Seller Information', 'Store Location', 'Contact Information', 'Opening Location',
  'Opening store location on Google Maps for purchase', 'You can also visit their store location or call them directly for inquiries.',
  'Visit the store location during business hours',
  
  // Loading states
  'Loading...', 'Processing...', 'Please wait...', 'Translating...', 'Analyzing...',
];

export const TranslationPreloader: React.FC = () => {
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    const preloadTranslations = async () => {
      if (currentLanguage === 'en') return;
      
      try {
        console.log(`Preloading translations for ${currentLanguage}...`);
        await preloadCommonTranslations(COMMON_TEXTS, currentLanguage);
        console.log('Translation preloading completed');
      } catch (error) {
        console.error('Translation preloading failed:', error);
      }
    };

    preloadTranslations();
  }, [currentLanguage]);

  return null; // This component doesn't render anything
}; 