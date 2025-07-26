"use client";
import React, { useState } from "react";
import AppLayout from '@/components/agrimitra/app-layout';
import { useRouter } from "next/navigation";
import ErrorBoundary from '@/components/error-boundary';
import { useNavigationHistory } from '@/hooks/use-navigation-history';

type Forum = {
  id: string;
  name: string;
  type: 'KVK' | 'FSF' | 'aAQUA';
  languages: string[];
  categories: string[];
  region: string;
};

type Location = {
  district: string;
  state: string;
};

const sampleForums: Forum[] = [
  {
    id: "kvk_bangalore",
    name: "KVK Bengaluru",
    type: "KVK",
    languages: ["Kannada", "English"],
    categories: ["Crops", "Weather"],
    region: "Karnataka"
  },
  {
    id: "fsf_karnataka",
    name: "Farmer-Scientist Forum Karnataka",
    type: "FSF",
    languages: ["Kannada"],
    categories: ["Pests", "Soil"],
    region: "Karnataka"
  },
  {
    id: "kvk_chennai",
    name: "KVK Chennai",
    type: "KVK",
    languages: ["Tamil", "English"],
    categories: ["Crops", "Weather"],
    region: "Tamil Nadu"
  },
  {
    id: "fsf_tamilnadu",
    name: "Farmer-Scientist Forum Tamil Nadu",
    type: "FSF",
    languages: ["Tamil"],
    categories: ["Pests", "Soil"],
    region: "Tamil Nadu"
  },
  {
    id: "aaqua",
    name: "aAQUA National Forum",
    type: "aAQUA",
    languages: ["Hindi", "English"],
    categories: ["All Topics"],
    region: "All India"
  },
  {
    id: "kvk_pune",
    name: "KVK Pune",
    type: "KVK",
    languages: ["Marathi", "English"],
    categories: ["Crops", "Weather"],
    region: "Maharashtra"
  },
  {
    id: "fsf_maharashtra",
    name: "Farmer-Scientist Forum Maharashtra",
    type: "FSF",
    languages: ["Marathi"],
    categories: ["Pests", "Soil"],
    region: "Maharashtra"
  }
];

const forumIcons = {
  KVK: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  FSF: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/></svg>
  ),
  aAQUA: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M8 12h8M8 9h8"/></svg>
  )
};

// Add a mapping from major cities to their states/regions
const cityToRegion: Record<string, string> = {
  "chennai": "Tamil Nadu",
  "bengaluru": "Karnataka",
  "bangalore": "Karnataka",
  "mumbai": "Maharashtra",
  "delhi": "Delhi",
  "kolkata": "West Bengal",
  "hyderabad": "Telangana",
  "pune": "Maharashtra",
  "ahmedabad": "Gujarat",
  "kochi": "Kerala",
  "trivandrum": "Kerala",
  "lucknow": "Uttar Pradesh",
  // Add more as needed
};

// Simple Levenshtein distance function
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export default function CommunityForumPage() {
  const router = useRouter();
  const { getPreviousPath } = useNavigationHistory();
  const [location, setLocation] = useState<{ district: string; state: string } | null>(null);
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("");
  const [image, setImage] = useState<File|null>(null);

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    
    // Mock location detection for demo
    setTimeout(() => {
      const detectedLocation = { district: "Bengaluru", state: "Karnataka" };
      const filteredForums = sampleForums.filter(f => f.region === "Karnataka" || f.region === "All India");
      
      setLocation(detectedLocation);
      setForums(filteredForums);
      setIsDetectingLocation(false);
    }, 2000);
  };

  const handleForumSelect = (forum: Forum) => {
    setSelectedForum(forum);
    setLanguage(forum.languages[0]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Available districts and states for suggestions
  const availableDistricts = [
    "Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kalaburagi", 
    "Vijayapura", "Ballari", "Tumakuru", "Kolar", "Mandya", "Hassan", "Chitradurga",
    "Shivamogga", "Davanagere", "Raichur", "Bidar", "Yadgir", "Koppal", "Gadag",
    "Dharwad", "Uttara Kannada", "Chikkamagaluru", "Kodagu", "Chikkaballapur",
    "Ramanagara", "Chamrajnagar", "Bagalkot", "Vijayanagara"
  ];

  const availableStates = [
    "Karnataka", "Maharashtra", "Tamil Nadu", "Kerala", "Andhra Pradesh", 
    "Telangana", "Goa", "Rajasthan", "Gujarat", "Madhya Pradesh", "Chhattisgarh",
    "Odisha", "West Bengal", "Bihar", "Jharkhand", "Uttar Pradesh", "Uttarakhand",
    "Himachal Pradesh", "Punjab", "Haryana", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Tripura", "Sikkim"
  ];

  // Comprehensive location mapping
  const locationMapping: { [key: string]: { district: string; state: string } } = {
    // Karnataka cities/districts
    "bengaluru": { district: "Bengaluru", state: "Karnataka" },
    "bangalore": { district: "Bengaluru", state: "Karnataka" },
    "mysuru": { district: "Mysuru", state: "Karnataka" },
    "mysore": { district: "Mysuru", state: "Karnataka" },
    "mangaluru": { district: "Mangaluru", state: "Karnataka" },
    "mangalore": { district: "Mangaluru", state: "Karnataka" },
    "hubballi": { district: "Hubballi", state: "Karnataka" },
    "hubli": { district: "Hubballi", state: "Karnataka" },
    "belagavi": { district: "Belagavi", state: "Karnataka" },
    "belgaum": { district: "Belagavi", state: "Karnataka" },
    "kalaburagi": { district: "Kalaburagi", state: "Karnataka" },
    "gulbarga": { district: "Kalaburagi", state: "Karnataka" },
    "vijayapura": { district: "Vijayapura", state: "Karnataka" },
    "bijapur": { district: "Vijayapura", state: "Karnataka" },
    "ballari": { district: "Ballari", state: "Karnataka" },
    "bellary": { district: "Ballari", state: "Karnataka" },
    "tumakuru": { district: "Tumakuru", state: "Karnataka" },
    "tumkur": { district: "Tumakuru", state: "Karnataka" },
    "kolar": { district: "Kolar", state: "Karnataka" },
    "mandya": { district: "Mandya", state: "Karnataka" },
    "hassan": { district: "Hassan", state: "Karnataka" },
    "chitradurga": { district: "Chitradurga", state: "Karnataka" },
    "shivamogga": { district: "Shivamogga", state: "Karnataka" },
    "shimoga": { district: "Shivamogga", state: "Karnataka" },
    "davanagere": { district: "Davanagere", state: "Karnataka" },
    "davangere": { district: "Davanagere", state: "Karnataka" },
    "raichur": { district: "Raichur", state: "Karnataka" },
    "bidar": { district: "Bidar", state: "Karnataka" },
    "yadgir": { district: "Yadgir", state: "Karnataka" },
    "koppal": { district: "Koppal", state: "Karnataka" },
    "gadag": { district: "Gadag", state: "Karnataka" },
    "dharwad": { district: "Dharwad", state: "Karnataka" },
    "uttara kannada": { district: "Uttara Kannada", state: "Karnataka" },
    "karwar": { district: "Uttara Kannada", state: "Karnataka" },
    "chikkamagaluru": { district: "Chikkamagaluru", state: "Karnataka" },
    "chikmagalur": { district: "Chikkamagaluru", state: "Karnataka" },
    "kodagu": { district: "Kodagu", state: "Karnataka" },
    "coorg": { district: "Kodagu", state: "Karnataka" },
    "chikkaballapur": { district: "Chikkaballapur", state: "Karnataka" },
    "chikballapur": { district: "Chikkaballapur", state: "Karnataka" },
    "ramanagara": { district: "Ramanagara", state: "Karnataka" },
    "chamrajnagar": { district: "Chamrajnagar", state: "Karnataka" },
    "bagalkot": { district: "Bagalkot", state: "Karnataka" },
    "vijayanagara": { district: "Vijayanagara", state: "Karnataka" },
    "hospet": { district: "Vijayanagara", state: "Karnataka" },

    // Other major cities
    "mumbai": { district: "Mumbai", state: "Maharashtra" },
    "pune": { district: "Pune", state: "Maharashtra" },
    "nagpur": { district: "Nagpur", state: "Maharashtra" },
    "nashik": { district: "Nashik", state: "Maharashtra" },
    "chennai": { district: "Chennai", state: "Tamil Nadu" },
    "madras": { district: "Chennai", state: "Tamil Nadu" },
    "coimbatore": { district: "Coimbatore", state: "Tamil Nadu" },
    "salem": { district: "Salem", state: "Tamil Nadu" },
    "madurai": { district: "Madurai", state: "Tamil Nadu" },
    "thiruvananthapuram": { district: "Thiruvananthapuram", state: "Kerala" },
    "trivandrum": { district: "Thiruvananthapuram", state: "Kerala" },
    "kochi": { district: "Kochi", state: "Kerala" },
    "cochin": { district: "Kochi", state: "Kerala" },
    "kozhikode": { district: "Kozhikode", state: "Kerala" },
    "calicut": { district: "Kozhikode", state: "Kerala" },
    "hyderabad": { district: "Hyderabad", state: "Telangana" },
    "warangal": { district: "Warangal", state: "Telangana" },
    "visakhapatnam": { district: "Visakhapatnam", state: "Andhra Pradesh" },
    "vizag": { district: "Visakhapatnam", state: "Andhra Pradesh" },
    "vijayawada": { district: "Vijayawada", state: "Andhra Pradesh" },
    "guntur": { district: "Guntur", state: "Andhra Pradesh" },
    "panaji": { district: "Panaji", state: "Goa" },
    "panjim": { district: "Panaji", state: "Goa" },
    "margao": { district: "Margao", state: "Goa" },
    "vasco": { district: "Vasco da Gama", state: "Goa" }
  };

  // All available locations for suggestions
  const allLocations = [
    ...Object.keys(locationMapping),
    ...availableDistricts.map(d => d.toLowerCase()),
    ...availableStates.map(s => s.toLowerCase())
  ];

  // Calculate Levenshtein distance for fuzzy matching
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Find similar matches
  const findSimilarMatches = (input: string, options: string[], maxDistance: number = 3): string[] => {
    if (!input.trim()) return [];
    
    const matches = options
      .map(option => ({
        option,
        distance: levenshteinDistance(input.toLowerCase(), option.toLowerCase())
      }))
      .filter(match => match.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5) // Limit to 5 suggestions
      .map(match => match.option);
    
    return matches;
  };

  // Handle manual input changes with suggestions
  const handleManualInputChange = (value: string) => {
    setManualLocation(value);
    
    if (value.trim()) {
      const matches = findSimilarMatches(value, allLocations);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (value: string) => {
    setManualLocation(value);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <ErrorBoundary>
      <AppLayout
        title="Community Forum"
        subtitle="Connect with other farmers and experts in your region."
        showBackButton={true}
        onBack={() => {
          const previousPath = getPreviousPath();
          if (previousPath) {
            router.push(previousPath);
          } else {
            router.push('/expert-connect');
          }
        }}
      >
      <div className="w-full max-w-4xl mx-auto mt-8 p-4">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">Community Forum</h2>
        
        {!location && (
          <div className="flex flex-col items-center space-y-6">
            <button
              className="px-10 py-5 bg-green-600 text-white rounded-lg font-bold text-2xl shadow hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Detecting Location...
                </div>
              ) : (
                'Detect My Location'
              )}
            </button>
            
            <div className="text-center">
              <span className="text-gray-500">or</span>
            </div>
            
            <button
              className="px-10 py-5 bg-blue-600 text-white rounded-lg font-bold text-2xl shadow hover:bg-blue-700 transition-colors"
              onClick={() => setShowManualInput(true)}
            >
              Enter My Location
            </button>
            
            {showManualInput && (
              <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Enter Your Location</h3>
                
                <div className="space-y-4">
                  {/* District Input */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location (District, State)
                    </label>
                    <input
                      type="text"
                      value={manualLocation}
                      onChange={(e) => handleManualInputChange(e.target.value)}
                      placeholder="Enter your location (e.g., Bengaluru, Karnataka)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {locationError && (
                    <p className="text-red-500 text-sm">{locationError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (manualLocation.trim()) {
                          const input = manualLocation.trim().toLowerCase();
                          
                          // First check exact match in location mapping
                          if (locationMapping[input]) {
                            const mapped = locationMapping[input];
                            setLocation(mapped);
                            setForums(sampleForums.filter(f => 
                              f.region === mapped.state || f.region === "All India"
                            ));
                            setShowManualInput(false);
                            setManualLocation("");
                            setSuggestions([]);
                            setShowSuggestions(false);
                            setLocationError("");
                            return;
                          }
                          
                          // Check if it's a district, state format
                          if (input.includes(',')) {
                            const [district, state] = input.split(',').map(s => s.trim());
                            if (district && state) {
                              setLocation({ district, state });
                              setForums(sampleForums.filter(f => 
                                f.region === state || f.region === "All India"
                              ));
                              setShowManualInput(false);
                              setManualLocation("");
                              setSuggestions([]);
                              setShowSuggestions(false);
                              setLocationError("");
                              return;
                            }
                          }
                          
                          // Try fuzzy matching for state
                          const stateMatch = availableStates.find(state => 
                            state.toLowerCase().includes(input) || 
                            input.includes(state.toLowerCase())
                          );
                          
                          if (stateMatch) {
                            setLocation({ district: "Unknown", state: stateMatch });
                            setForums(sampleForums.filter(f => 
                              f.region === stateMatch || f.region === "All India"
                            ));
                            setShowManualInput(false);
                            setManualLocation("");
                            setSuggestions([]);
                            setShowSuggestions(false);
                            setLocationError("");
                            return;
                          }
                          
                          // If no match found, show error
                          setLocationError("Location not found. Please try a different location or check spelling.");
                        } else {
                          setLocationError("Please enter a location.");
                        }
                      }}
                      disabled={!manualLocation.trim()}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Find Forums
                    </button>
                    <button
                      onClick={() => {
                        setShowManualInput(false);
                        setManualLocation("");
                        setSuggestions([]);
                        setShowSuggestions(false);
                        setLocationError("");
                      }}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {location && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Location Info */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">📍 Location Detected</h3>
                  <p className="text-green-700">Showing forums for <strong>{location.district}, {location.state}</strong></p>
                  <p className="text-sm text-green-600 mt-1">Found {forums.length} available forums</p>
                </div>
                <button
                  onClick={() => {
                    setLocation(null);
                    setForums([]);
                    setSelectedForum(null);
                    setShowManualInput(false);
                  }}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Change Location
                </button>
              </div>
            </div>

            {/* Forums Grid */}
            {!selectedForum && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Available Forums</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forums.map(forum => (
                    <div
                      key={forum.id}
                      className="p-4 rounded-xl shadow bg-white flex flex-col items-center cursor-pointer border border-green-100 hover:border-green-400 transition-all duration-200"
                      onClick={() => handleForumSelect(forum)}
                    >
                      {forumIcons[forum.type]}
                      <div className="font-bold mt-2 text-green-800 text-lg text-center">{forum.name}</div>
                      <div className="text-xs text-gray-500 mt-1 text-center">{forum.languages.join(", ")}</div>
                      <div className="flex gap-1 mt-2 flex-wrap justify-center">
                        {forum.categories.map(cat => (
                          <span key={cat} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{cat}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Forum */}
            {selectedForum && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {forumIcons[selectedForum.type]}
                    <div className="font-bold text-green-800 text-lg">{selectedForum.name}</div>
                  </div>
                  <button
                    onClick={() => setSelectedForum(null)}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Back to Forums
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Language:</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="p-2 border rounded w-full bg-white text-gray-900 border-gray-300 focus:ring-green-500 focus:border-green-500"
                    >
                      {selectedForum.languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Question or Suggestion:</label>
                    <textarea
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      className="p-2 border rounded w-full min-h-[80px] bg-white text-gray-900 border-gray-300 focus:ring-green-500 focus:border-green-500"
                      placeholder="Type your question or share your experience..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (optional):</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                    {image && <div className="mt-2 text-xs text-gray-600">Selected: {image.name}</div>}
                  </div>
                  
                  <button
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold shadow hover:bg-green-700 transition-colors"
                    onClick={() => {
                      alert('Posted! (demo only)');
                      setQuestion("");
                      setImage(null);
                      setSelectedForum(null);
                    }}
                  >
                    Post to Forum
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
    </ErrorBoundary>
  );
} 