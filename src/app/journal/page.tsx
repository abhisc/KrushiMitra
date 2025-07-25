"use client";

import React, { useState } from "react";
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

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  fertilizer: { label: "Fertilizer", icon: <FlaskConical className="w-5 h-5 text-yellow-700" />, color: "bg-yellow-50 border-yellow-200" },
  "crop activity": { label: "Crop Activity", icon: <Leaf className="w-5 h-5 text-green-700" />, color: "bg-green-50 border-green-200" },
  water: { label: "Water", icon: <Droplet className="w-5 h-5 text-blue-700" />, color: "bg-blue-50 border-blue-200" },
  weather: { label: "Weather", icon: <CloudSun className="w-5 h-5 text-sky-700" />, color: "bg-sky-50 border-sky-200" },
  other: { label: "Other", icon: <List className="w-5 h-5 text-gray-700" />, color: "bg-gray-50 border-gray-200" },
};

export default function FarmJournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [textInput, setTextInput] = useState("");
  const [entries, setEntries] = useState<FarmJournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-700" /> Farm Journal Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Label>Describe today's activity, input, or weather event</Label>
              <Textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={
                  "E.g. Planted maize, applied NPK fertilizer, heavy rain damaged crops, observed pest incident..."
                }
                disabled={loading}
              />
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "Logging..." : "Log Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Timeline Table View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-green-700" /> Timeline & History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No entries yet. Start logging your farm activities!</div>
            ) : (
              Object.entries(groupEntriesByType(entries)).map(([type, group]) => {
                const meta = TYPE_META[type.toLowerCase()] || TYPE_META.other;
                return (
                  <div key={type} className={`mb-6 rounded-lg border ${meta.color} p-4`}>
                    <div className="flex items-center gap-2 mb-2 font-semibold text-lg">
                      {meta.icon} {meta.label}
                    </div>
                    <ul className="space-y-2">
                      {group.map((entry, idx) => (
                        <li key={idx} className="flex flex-col md:flex-row md:items-center md:gap-4 border-b last:border-b-0 pb-2">
                          <span className="font-mono text-xs text-gray-500 w-24">{new Date(entry?.createdAt)?.toLocaleDateString()}</span>
                          <span className="font-semibold text-gray-800">{entry.quantity ? `${entry.quantity}${entry.unit ? ' ' + entry.unit : ''}` : ''}</span>
                          <span className="text-gray-700 flex-1">{entry.rawText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Insights & Analytics Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-green-700" /> Insights & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500">Charts and smart reminders will appear here based on your journal history.</div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 