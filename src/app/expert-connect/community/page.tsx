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
  const [location, setLocation] = useState<Location|null>(null);
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum|null>(null);
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("");
  const [image, setImage] = useState<File|null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    // Mock location detection for demo
    setTimeout(() => {
      setLocation({ district: "Bengaluru", state: "Karnataka" });
      setForums(sampleForums.filter(f => f.region === "Karnataka" || f.region === "All India"));
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
              <form
                className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 items-center w-full max-w-md mt-2"
                onSubmit={e => {
                  e.preventDefault();
                  setLocationError("");
                  // Try to map entered location to a known region/state
                  const loc = manualLocation.trim().toLowerCase();
                  let mappedRegion = cityToRegion[loc] || manualLocation;
                  // Fuzzy match if not found
                  if (!cityToRegion[loc]) {
                    let minDist = 3;
                    let bestCity = "";
                    for (const city in cityToRegion) {
                      const dist = levenshtein(loc, city);
                      if (dist < minDist) {
                        minDist = dist;
                        bestCity = city;
                      }
                    }
                    if (bestCity) {
                      mappedRegion = cityToRegion[bestCity];
                    } else {
                      // Try fuzzy match on forum regions
                      let minRegionDist = 3;
                      let bestRegion = "";
                      for (const forum of sampleForums) {
                        const dist = levenshtein(loc, forum.region.toLowerCase());
                        if (dist < minRegionDist) {
                          minRegionDist = dist;
                          bestRegion = forum.region;
                        }
                      }
                      if (bestRegion) {
                        mappedRegion = bestRegion;
                      }
                    }
                  }
                  // Check if mappedRegion matches any forum region (case-insensitive)
                  const validRegion = sampleForums.some(f => f.region.toLowerCase() === mappedRegion.toLowerCase());
                  if (!validRegion) {
                    setLocationError("Location not found. Please try again.");
                    return;
                  }
                  setLocation({ district: manualLocation, state: mappedRegion });
                  setForums(sampleForums.filter(f => f.region.toLowerCase() === mappedRegion.toLowerCase() || f.region === "All India"));
                  setShowManualInput(false);
                }}
              >
                <input
                  type="text"
                  placeholder="Enter Your Location (city, village, etc.)"
                  value={manualLocation}
                  onChange={e => setManualLocation(e.target.value)}
                  className="p-3 border rounded w-full bg-gray-50 text-gray-900 border-gray-300 focus:ring-green-500 focus:border-green-500"
                  required
                />
                {locationError && (
                  <div className="text-red-600 font-semibold mt-2">{locationError}</div>
                )}
                <button
                  type="submit"
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold text-lg shadow hover:bg-green-700"
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="px-8 py-3 bg-gray-300 text-gray-800 rounded-lg font-bold text-lg shadow hover:bg-gray-400"
                  onClick={() => setShowManualInput(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
        
        {location && (
          <div className="space-y-8">
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