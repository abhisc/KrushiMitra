"use client";

import React, { useState } from "react";
import AppLayout from "@/components/agrimitra/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, BarChart3, BookOpen, Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// Stub for Gemini AI classification (replace with real API call)
async function classifyWithAI(text: string): Promise<string> {
  // TODO: Replace with actual Gemini API call
  // For now, use a simple keyword-based fallback
  const t = text.toLowerCase();
  if (/(plant|sow|harvest|germinat|growth|pest|disease|spray|observe|crop|field)/.test(t)) {
    return "Crop Activity";
  }
  if (/(fertiliz|urea|npk|compost|input|chemical|dose|application|vendor)/.test(t)) {
    return "Fertilizer";
  }
  if (/(rain|weather|hail|storm|dry|wet|temperature|climate|impact)/.test(t)) {
    return "Weather";
  }
  return "Other";
}

interface JournalEntry {
  date: string;
  user: string;
  type: string;
  text: string;
}

export default function FarmJournalPage() {
  const { user } = useAuth();
  const [textInput, setTextInput] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !user) return;
    const type = await classifyWithAI(textInput);
    setEntries([
      ...entries,
      {
        type,
        text: textInput,
        date: new Date().toLocaleString(),
        user: user.displayName || user.email || "Unknown",
      },
    ]);
    setTextInput("");
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditText(entries[idx].text);
  };

  const handleSave = async (idx: number) => {
    const updated = [...entries];
    const type = await classifyWithAI(editText);
    updated[idx] = { ...updated[idx], text: editText, type };
    setEntries(updated);
    setEditIdx(null);
    setEditText("");
  };

  const handleCancel = () => {
    setEditIdx(null);
    setEditText("");
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
              />
              <Button type="submit" className="w-full mt-2">Log Entry</Button>
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
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 border">Date</th>
                    <th className="px-3 py-2 border">User</th>
                    <th className="px-3 py-2 border">Type</th>
                    <th className="px-3 py-2 border">Details</th>
                    <th className="px-3 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-gray-500 text-center py-4">No entries yet. Start logging your farm activities!</td>
                    </tr>
                  ) : (
                    entries.map((entry, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2 border whitespace-nowrap">{entry.date}</td>
                        <td className="px-3 py-2 border whitespace-nowrap">{entry.user}</td>
                        <td className={`px-3 py-2 border whitespace-nowrap ${
                          entry.type === "Crop Activity"
                            ? "bg-green-100 text-green-700"
                            : entry.type === "Fertilizer"
                            ? "bg-yellow-100 text-yellow-700"
                            : entry.type === "Weather"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {entry.type}
                        </td>
                        <td className="px-3 py-2 border">
                          {editIdx === idx ? (
                            <Textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              className="min-w-[200px]"
                            />
                          ) : (
                            entry.text
                          )}
                        </td>
                        <td className="px-3 py-2 border">
                          {editIdx === idx ? (
                            <div className="flex gap-2">
                              <Button size="sm" type="button" onClick={() => handleSave(idx)}><Save className="w-4 h-4" /></Button>
                              <Button size="sm" type="button" variant="outline" onClick={handleCancel}><X className="w-4 h-4" /></Button>
                            </div>
                          ) : (
                            <Button size="sm" type="button" variant="ghost" onClick={() => handleEdit(idx)}><Pencil className="w-4 h-4" /></Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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