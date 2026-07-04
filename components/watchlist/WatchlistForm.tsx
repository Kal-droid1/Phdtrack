"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Watchlist, Priority } from "@/types";
import { Bell, Pin } from "lucide-react";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

interface WatchlistFormProps {
  initialData?: Watchlist;
  prefillData?: Partial<Watchlist>;
  onSave: () => void;
  onClose: () => void;
}

export default function WatchlistForm({
  initialData,
  prefillData,
  onSave,
  onClose,
}: WatchlistFormProps) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [fundingBody, setFundingBody] = useState("");
  const [country, setCountry] = useState("");
  const [expectedOpenDate, setExpectedOpenDate] = useState("");
  const [expectedDeadline, setExpectedDeadline] = useState("");
  const [url, setUrl] = useState("");
  const [reminder, setReminder] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPriority(initialData.priority);
      setFundingBody(initialData.funding_body ?? "");
      setCountry(initialData.country ?? "");
      setExpectedOpenDate(initialData.expected_open_date ? initialData.expected_open_date.slice(0, 10) : "");
      setExpectedDeadline(initialData.expected_deadline ? initialData.expected_deadline.slice(0, 10) : "");
      setUrl(initialData.url ?? "");
      setReminder(initialData.reminder);
      setPinned(initialData.pinned);
      setNotes(initialData.notes ?? "");
    } else if (prefillData) {
      setName(prefillData.name ?? "");
      setPriority(prefillData.priority ?? "normal");
      setFundingBody(prefillData.funding_body ?? "");
      setCountry(prefillData.country ?? "");
      setExpectedOpenDate(prefillData.expected_open_date ? prefillData.expected_open_date.slice(0, 10) : "");
      setExpectedDeadline(prefillData.expected_deadline ? prefillData.expected_deadline.slice(0, 10) : "");
      setUrl(prefillData.url ?? "");
      setReminder(prefillData.reminder ?? false);
      setPinned(prefillData.pinned ?? false);
      setNotes(prefillData.notes ?? "");
    }
  }, [initialData, prefillData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      priority,
      funding_body: fundingBody || null,
      country: country || null,
      expected_open_date: expectedOpenDate || null,
      expected_deadline: expectedDeadline || null,
      url: url || null,
      reminder,
      pinned,
      notes: notes || null,
    };

    try {
      if (initialData) {
        const { error: updateError } = await supabase.from("watchlist").update(payload).eq("id", initialData.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("watchlist").insert(payload);
        if (insertError) throw insertError;
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 rounded-xl text-sm leading-relaxed bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">
          Name <span className="text-red-500">*</span>
        </label>
        <input type="text" required placeholder="e.g. Fulbright Scholarship" value={name} onChange={(e) => setName(e.target.value)} className="border-gray-200" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="border-gray-200"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Pin</label>
        <button
          type="button"
          onClick={() => setPinned(!pinned)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
            pinned
              ? "bg-indigo-50 border-indigo-200 text-indigo-600"
              : "bg-white border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
          }`}
        >
          <Pin size={18} fill={pinned ? "currentColor" : "none"} />
          Pin to top
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Funding Body</label>
          <input type="text" placeholder="e.g. DAAD" value={fundingBody} onChange={(e) => setFundingBody(e.target.value)} className="border-gray-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Country</label>
          <input type="text" placeholder="e.g. Germany" value={country} onChange={(e) => setCountry(e.target.value)} className="border-gray-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Expected Open Date</label>
          <input type="date" value={expectedOpenDate} onChange={(e) => setExpectedOpenDate(e.target.value)} className="border-gray-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Expected Deadline</label>
          <input type="date" value={expectedDeadline} onChange={(e) => setExpectedDeadline(e.target.value)} className="border-gray-200" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">URL <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="border-gray-200" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Reminder</label>
        <button
          type="button"
          onClick={() => setReminder(!reminder)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
            reminder
              ? "bg-amber-50 border-amber-200 text-amber-600"
              : "bg-white border-gray-200 text-gray-500 hover:border-amber-200 hover:text-amber-600"
          }`}
        >
          <Bell size={18} fill={reminder ? "currentColor" : "none"} />
          Remind me when opening soon
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">Notes</label>
        <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="border-gray-200" />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium rounded-xl text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          {saving ? "Saving..." : initialData ? "Update" : "Add to Watchlist"}
        </button>
      </div>
    </form>
  );
}
