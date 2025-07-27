"use client";

import React, { useState, useRef } from "react";
import AppLayout from "@/components/agrimitra/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, BarChart3, BookOpen, Leaf, Droplet, CloudSun, FlaskConical, List } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { FarmJournalEntry } from "@/ai/flows/farm-journal-extract";
import { addEntry, getEntries } from "@/firebaseStore/services/farm-journal-service";
import { useToast } from "@/hooks/use-toast";

// Helper to group entries by type
function groupEntriesByType(entries: FarmJournalEntry[]) {
  const groups: Record<string, FarmJournalEntry[]> = {};
  for (const entry of entries) {
    const type = entry.type || "Other";
    if (!groups[type]) groups[type] = [];
    groups[type].push(entry);
  }
  return groups;
}

// Helper to safely format ISO date strings
function formatDate(dateStr: string | undefined, format: string = ''): string {
  let d: Date;
  if (!dateStr) {
    d = new Date();
  } else {
    d = new Date(dateStr);
    if (isNaN(d.getTime())) d = new Date();
  }
  if (format) {
    // Simple custom format: 'MMM d, yyyy'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || '';
  }
  return d.toLocaleDateString() || '';
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; darkColor: string }> = {
  "land preparation": {
    label: "Land Prep",
    icon: <span className="text-orange-700 dark:text-orange-400"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg></span>,
    color: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/30",
    darkColor: "dark:bg-orange-950/20 dark:border-orange-800/30"
  },
  "sowing": {
    label: "Sowing",
    icon: <span className="text-lime-700 dark:text-lime-400"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>,
    color: "bg-lime-50 border-lime-200 dark:bg-lime-950/20 dark:border-lime-800/30",
    darkColor: "dark:bg-lime-950/20 dark:border-lime-800/30"
  },
  "crop management": {
    label: "Crop Mgmt",
    icon: <Leaf className="w-5 h-5 text-green-700 dark:text-green-400" />,
    color: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30",
    darkColor: "dark:bg-green-950/20 dark:border-green-800/30"
  },
  "irrigation": {
    label: "Irrigation",
    icon: <Droplet className="w-5 h-5 text-blue-700 dark:text-blue-400" />,
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30",
    darkColor: "dark:bg-blue-950/20 dark:border-blue-800/30"
  },
  "fertilizer": {
    label: "Fertilizer",
    icon: <span className="text-yellow-700 dark:text-yellow-400"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h6m2 7a2 2 0 002-2v-5.586a1 1 0 00-.293-.707l-7-7a1 1 0 00-1.414 0l-7 7A1 1 0 004 12.414V18a2 2 0 002 2h12z" /></svg></span>,
    color: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30",
    darkColor: "dark:bg-yellow-950/20 dark:border-yellow-800/30"
  },
  "pest control": {
    label: "Pest Control",
    icon: <span className="text-red-700 dark:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>,
    color: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30",
    darkColor: "dark:bg-red-950/20 dark:border-red-800/30"
  },
  "weather": {
    label: "Weather",
    icon: <CloudSun className="w-5 h-5 text-sky-700 dark:text-sky-400" />,
    color: "bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-800/30",
    darkColor: "dark:bg-sky-950/20 dark:border-sky-800/30"
  },
  "harvest": {
    label: "Harvest",
    icon: <span className="text-amber-700 dark:text-amber-400"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg></span>,
    color: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30",
    darkColor: "dark:bg-amber-950/20 dark:border-amber-800/30"
  },
  "post-harvest": {
    label: "Post-Harvest",
    icon: <span className="text-stone-700 dark:text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></span>,
    color: "bg-stone-50 border-stone-200 dark:bg-stone-950/20 dark:border-stone-800/30",
    darkColor: "dark:bg-stone-950/20 dark:border-stone-800/30"
  },
  "sales": {
    label: "Sales",
    icon: <BarChart3 className="w-5 h-5 text-teal-700 dark:text-teal-400" />,
    color: "bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800/30",
    darkColor: "dark:bg-teal-950/20 dark:border-teal-800/30"
  },
  "finance": {
    label: "Finance",
    icon: <span className="text-indigo-700 dark:text-indigo-400"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg></span>,
    color: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800/30",
    darkColor: "dark:bg-indigo-950/20 dark:border-indigo-800/30"
  },
  "equipment": {
    label: "Equipment",
    icon: <span className="text-slate-700 dark:text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></span>,
    color: "bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800/30",
    darkColor: "dark:bg-slate-950/20 dark:border-slate-800/30"
  },
  "other": {
    label: "Other",
    icon: <List className="w-5 h-5 text-gray-600 dark:text-gray-400" />,
    color: "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50",
    darkColor: "dark:bg-gray-800/50 dark:border-gray-700/50"
  },
};

export default function FarmJournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [textInput, setTextInput] = useState("");
  const [entries, setEntries] = useState<FarmJournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Fetch entries on load
  React.useEffect(() => {
    if (user) {
      setTimelineLoading(true);
      getEntries(user.uid)
        .then(data => {
          setEntries(data);
          setTimelineLoading(false);
        })
        .catch(err => {
          toast({ title: "Failed to load entries", description: err.message, variant: "destructive" });
          setTimelineLoading(false);
        });
    }
  }, [user, toast]);

  // Speech-to-text handler
  const handleMicClick = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTextInput(prev => prev ? prev + ' ' + transcript : transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !user) return;
    setLoading(true);
    try {
      // Call the API route instead of the flow directly
      const res = await fetch("/api/extract-farm-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: textInput }),
      });
      if (!res.ok) throw new Error("AI extraction failed");
      const aiResult = await res.json();
      console.log("AI extraction result:", aiResult);
      const newEntry = { ...aiResult, rawText: textInput };
      await addEntry(newEntry, user.uid);
      toast({ title: "Entry saved!", description: "Your farm journal entry was logged successfully." });
      setTextInput("");
      
      // Refresh entries by adding the new one to the top of the list
      setEntries(prevEntries => [newEntry, ...prevEntries]);
      
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to log entry.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="My Journal" subtitle="Log and track your farm activities, inputs, and weather events.">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Modernized Input Bar */}
        <Card className="shadow-xl rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-700 dark:text-green-400" /> My Journal Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Label>Describe today's activity, input, or weather event</Label>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-green-200 dark:focus-within:ring-green-600 relative transition-all duration-300">
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={listening ? "Listening..." : "E.g. Planted maize, applied NPK fertilizer, heavy rain damaged crops, observed pest incident..."}
                  disabled={loading}
                  className="flex-1 border-none shadow-none bg-transparent focus:ring-0 focus:outline-none text-base min-w-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  style={listening ? { color: '#4F46E5', fontWeight: 600 } : {}}
                />
                {loading ? (
                  <div className="flex items-center justify-center w-10 h-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                ) : textInput ? (
                  <button type="submit" className="flex items-center justify-center bg-[#4F46E5] hover:bg-[#3730A3] rounded-full w-10 h-10 transition-colors focus:outline-none shadow" title="Send">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m0 0l-4-4m4 4l-4 4" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`flex items-center justify-center rounded-full w-10 h-10 transition-colors focus:outline-none shadow relative ${listening ? 'bg-[#4F46E5] animate-pulse' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
                    title="Voice input"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 transition-all duration-200 ${listening ? 'text-white' : 'text-[#4F46E5] dark:text-indigo-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v2m0 0a4 4 0 01-4-4h0a4 4 0 018 0h0a4 4 0 01-4 4zm0-6v2m0-2a4 4 0 00-4 4h0a4 4 0 008 0h0a4 4 0 00-4-4zm0 0V6a4 4 0 00-8 0v6a4 4 0 008 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        {/* Modernized Timeline Cards */}
        {Object.entries(groupEntriesByType(entries)).map(([type, group]) => {
          const meta = TYPE_META[type.toLowerCase()] || TYPE_META.other;
          return (
            <div key={type} className={`mb-8 rounded-2xl shadow-lg border ${meta.color} p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 animate-fade-in`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{meta.icon}</span>
                <span className="text-xl font-bold tracking-tight text-gray-800 dark:text-gray-200">{meta.label}</span>
              </div>
              <div className="flex flex-row md:items-center md:gap-4 border-b border-gray-200 dark:border-gray-700 pb-1 mb-1 text-xs text-gray-400 dark:text-gray-500 font-semibold">
                <span className="w-28 text-center font-semibold">Created date</span>
                <span className="flex-1 font-semibold">Log</span>
              </div>
              <div className="flex flex-col gap-2">
                {group.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 relative group">
                    {/* Timeline dot */}
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 dark:from-blue-500 dark:to-purple-500 rounded-full shadow-md group-hover:scale-125 transition-transform"></span>
                    <span className="w-28 text-sm font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded px-2 py-1 text-center shadow-sm">
                      {formatDate(entry.date, 'MMM d, yyyy')}
                    </span>
                    <span className="flex-1 text-base text-gray-800 dark:text-gray-200">{entry.rawText}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
} 