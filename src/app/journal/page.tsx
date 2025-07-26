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

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  fertilizer: { label: "Fertilizer", icon: <span className="text-yellow-700"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h6m2 7a2 2 0 002-2v-5.586a1 1 0 00-.293-.707l-7-7a1 1 0 00-1.414 0l-7 7A1 1 0 004 12.414V18a2 2 0 002 2h12z" /></svg></span>, color: "bg-yellow-50 border-yellow-200" },
  "crop activity": { label: "Crop Activity", icon: <Leaf className="w-5 h-5 text-green-700" />, color: "bg-green-50 border-green-200" },
  water: { label: "Water", icon: <Droplet className="w-5 h-5 text-blue-700" />, color: "bg-blue-50 border-blue-200" },
  weather: { label: "Weather", icon: <CloudSun className="w-5 h-5 text-sky-700" />, color: "bg-sky-50 border-sky-200" },
  other: { label: "Other", icon: <span className="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="inline w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></span>, color: "bg-gray-50 border-gray-200" },
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
      await addEntry({ ...aiResult, rawText: textInput }, user.uid);
      toast({ title: "Entry saved!", description: "Your farm journal entry was logged successfully." });
      setTextInput("");
      // Refresh entries
      setTimelineLoading(true);
      const updated = await getEntries(user.uid);
      console.log("Fetched entries after save:", updated);
      setEntries(updated);
      setTimelineLoading(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to log entry.", variant: "destructive" });
      setTimelineLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Farm Journal" subtitle="Log and track your farm activities, inputs, and weather events.">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Modernized Input Bar */}
        <Card className="shadow-xl rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-700" /> Farm Journal Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Label>Describe today's activity, input, or weather event</Label>
              <div className="flex items-center gap-2 bg-white rounded-full shadow-lg px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-green-200 relative transition-all duration-300">
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={listening ? "Listening..." : "E.g. Planted maize, applied NPK fertilizer, heavy rain damaged crops, observed pest incident..."}
                  disabled={loading}
                  className="flex-1 border-none shadow-none bg-transparent focus:ring-0 focus:outline-none text-base min-w-0"
                  style={listening ? { color: '#4F46E5', fontWeight: 600 } : {}}
                />
                {textInput ? (
                  <button type="submit" className="flex items-center justify-center bg-[#4F46E5] hover:bg-[#3730A3] rounded-full w-10 h-10 transition-colors focus:outline-none shadow" title="Send">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m0 0l-4-4m4 4l-4 4" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`flex items-center justify-center rounded-full w-10 h-10 transition-colors focus:outline-none shadow relative ${listening ? 'bg-[#4F46E5] animate-pulse' : 'bg-gray-100 hover:bg-gray-200'}`}
                    title="Voice input"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 transition-all duration-200 ${listening ? 'text-white' : 'text-[#4F46E5]'}`}
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
            <div key={type} className={`mb-8 rounded-2xl shadow-lg border ${meta.color} p-6 bg-gradient-to-br from-white to-gray-50 animate-fade-in`}> {/* fade-in animation */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{meta.icon}</span>
                <span className="text-xl font-bold tracking-tight text-gray-800">{meta.label}</span>
              </div>
              <div className="flex flex-row md:items-center md:gap-4 border-b pb-1 mb-1 text-xs text-gray-400 font-semibold">
                <span className="w-28 text-center font-semibold">Created date</span>
                <span className="flex-1 font-semibold">Log</span>
              </div>
              <div className="flex flex-col gap-2">
                {group.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b last:border-b-0 relative group">
                    {/* Timeline dot */}
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full shadow-md group-hover:scale-125 transition-transform"></span>
                    <span className="w-28 text-sm font-mono text-blue-700 bg-blue-50 rounded px-2 py-1 text-center shadow-sm">
                      {formatDate(entry.date, 'MMM d, yyyy')}
                    </span>
                    <span className="flex-1 text-base text-gray-800">{entry.rawText}</span>
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