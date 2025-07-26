"use client";
import React, { useState } from "react";
import AppLayout from '@/components/agrimitra/app-layout';
import { useRouter } from "next/navigation";

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
  const [location, setLocation] = useState<Location|null>(null);
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum|null>(null);
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("");
  const [image, setImage] = useState<File|null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [locationError, setLocationError] = useState("");

  const handleDetectLocation = () => {
    // Mock location detection for demo
    setLocation({ district: "Bengaluru", state: "Karnataka" });
    setForums(sampleForums.filter(f => f.region === "Karnataka" || f.region === "All India"));
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
    <AppLayout
      title="Community Forum"
      subtitle="Connect with other farmers and experts in your region."
      showBackButton={true}
      onBack={() => router.back()}
    >
      <div className="w-full max-w-xl mx-auto mt-8 p-4 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
          <span>Community Forum</span>
        </h2>
        {!location && (
          <>
            <button
              className="px-10 py-5 bg-green-600 text-white rounded-lg font-bold text-2xl shadow hover:bg-green-700 mb-4"
              onClick={handleDetectLocation}
            >
              Detect My Location
            </button>
            <button
              className="px-10 py-5 bg-blue-600 text-white rounded-lg font-bold text-2xl shadow hover:bg-blue-700 mb-4"
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
          </>
        )}
        {location && !selectedForum && (
          <>
            <div className="mb-4 text-gray-700">Showing forums for <b>{location.district}, {location.state}</b>:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forums.map(forum => (
                <div
                  key={forum.id}
                  className="p-4 rounded-xl shadow bg-white flex flex-col items-center cursor-pointer border border-green-100 hover:border-green-400"
                  onClick={() => handleForumSelect(forum)}
                >
                  {forumIcons[forum.type]}
                  <div className="font-bold mt-2 text-green-800 text-lg">{forum.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{forum.languages.join(", ")}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {forum.categories.map(cat => (
                      <span key={cat} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{cat}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {selectedForum && (
          <div className="mt-6 bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              {forumIcons[selectedForum.type]}
              <div className="font-bold text-green-800 text-lg">{selectedForum.name}</div>
            </div>
            <div className="mb-2">
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
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Question or Suggestion:</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                className="p-2 border rounded w-full min-h-[80px] bg-white text-gray-900 border-gray-300 focus:ring-green-500 focus:border-green-500"
                placeholder="Type or use voice input..."
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (optional):</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {image && <div className="mt-2 text-xs text-gray-600">Selected: {image.name}</div>}
            </div>
            <button
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow hover:bg-green-700"
              onClick={() => alert('Posted! (demo only)')}
            >
              Post
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 