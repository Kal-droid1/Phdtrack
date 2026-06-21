"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Watchlist } from "@/types";
import { Bell } from "lucide-react";

interface WatchlistFormProps {
  initialData?: Watchlist;
  prefillData?: Partial<Watchlist>;
  onSave: () => void;
  onClose: () => void;
}

const fieldClasses =
  "w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:outline-2 focus:outline-[#4a7c59] focus:outline-offset-1";

export default function WatchlistForm({
  initialData,
  prefillData,
  onSave,
  onClose,
}: WatchlistFormProps) {
  const [name, setName] = useState("");
  const [fundingBody, setFundingBody] = useState("");
  const [country, setCountry] = useState("");
  const [expectedOpenDate, setExpectedOpenDate] = useState("");
  const [expectedDeadline, setExpectedDeadline] = useState("");
  const [url, setUrl] = useState("");
  const [reminder, setReminder] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setFundingBody(initialData.funding_body ?? "");
      setCountry(initialData.country ?? "");
      setExpectedOpenDate(initialData.expected_open_date ? initialData.expected_open_date.slice(0, 10) : "");
      setExpectedDeadline(initialData.expected_deadline ? initialData.expected_deadline.slice(0, 10) : "");
      setUrl(initialData.url ?? "");
      setReminder(initialData.reminder);
      setNotes(initialData.notes ?? "");
    } else if (prefillData) {
      setName(prefillData.name ?? "");
      setFundingBody(prefillData.funding_body ?? "");
      setCountry(prefillData.country ?? "");
      setExpectedOpenDate(prefillData.expected_open_date ? prefillData.expected_open_date.slice(0, 10) : "");
      setExpectedDeadline(prefillData.expected_deadline ? prefillData.expected_deadline.slice(0, 10) : "");
      setUrl(prefillData.url ?? "");
      setReminder(prefillData.reminder ?? false);
      setNotes(prefillData.notes ?? "");
    }
  }, [initialData, prefillData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      funding_body: fundingBody || null,
      country: country || null,
      expected_open_date: expectedOpenDate || null,
      expected_deadline: expectedDeadline || null,
      url: url || null,
      reminder,
      notes: notes || null,
    };

    try {
      if (initialData) {
        const { error: updateError } = await supabase
          .from("watchlist")
          .update(payload)
          .eq("id", initialData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("watchlist")
          .insert(payload);

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
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Fulbright Scholarship"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Funding Body
          </label>
          <input
            type="text"
            placeholder="e.g. DAAD"
            value={fundingBody}
            onChange={(e) => setFundingBody(e.target.value)}
            className={fieldClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            placeholder="e.g. Germany"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={fieldClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Open Date
          </label>
          <input
            type="date"
            value={expectedOpenDate}
            onChange={(e) => setExpectedOpenDate(e.target.value)}
            className={fieldClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Deadline
          </label>
          <input
            type="date"
            value={expectedDeadline}
            onChange={(e) => setExpectedDeadline(e.target.value)}
            className={fieldClasses}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={fieldClasses}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reminder
        </label>
        <button
          type="button"
          onClick={() => setReminder(!reminder)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
            reminder
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Bell size={18} fill={reminder ? "currentColor" : "none"} />
          Remind me when opening soon
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={fieldClasses}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-[#4a7c59] rounded-md hover:bg-[#3e6b4b] transition-colors disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : initialData
            ? "Update"
            : "Add to Watchlist"}
        </button>
      </div>
    </form>
  );
}
