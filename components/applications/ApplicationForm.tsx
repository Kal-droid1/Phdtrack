"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Application } from "@/types";
import { Bell } from "lucide-react";

const statuses: Application["status"][] = [
  "Applied",
  "Accepted",
  "Rejected",
  "Waitlisted",
];

interface ApplicationFormProps {
  initialData?: Application;
  prefillData?: Partial<Application>;
  onSave: () => void;
  onClose: () => void;
}

export default function ApplicationForm({
  initialData,
  prefillData,
  onSave,
  onClose,
}: ApplicationFormProps) {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [country, setCountry] = useState("");
  const [program, setProgram] = useState("");
  const [fundingBody, setFundingBody] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<Application["status"]>("Watching");
  const [reminder, setReminder] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setUniversity(initialData.university ?? "");
      setCountry(initialData.country ?? "");
      setProgram(initialData.program ?? "");
      setFundingBody(initialData.funding_body ?? "");
      setOpenDate(initialData.open_date ? initialData.open_date.slice(0, 10) : "");
      setDeadline(initialData.deadline ? initialData.deadline.slice(0, 10) : "");
      setStatus(initialData.status);
      setReminder(initialData.reminder);
      setNotes(initialData.notes ?? "");
    } else if (prefillData) {
      setName(prefillData.name ?? "");
      setUniversity(prefillData.university ?? "");
      setCountry(prefillData.country ?? "");
      setProgram(prefillData.program ?? "");
      setFundingBody(prefillData.funding_body ?? "");
      setOpenDate(prefillData.open_date ? prefillData.open_date.slice(0, 10) : "");
      setDeadline(prefillData.deadline ? prefillData.deadline.slice(0, 10) : "");
      setStatus(
        statuses.includes(prefillData.status as Application["status"])
          ? (prefillData.status as Application["status"])
          : "Watching"
      );
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
      university: university || null,
      country: country || null,
      program: program || null,
      funding_body: fundingBody || null,
      open_date: openDate || null,
      deadline: deadline || null,
      status,
      reminder,
      notes: notes || null,
    };

    try {
      if (initialData) {
        const { error: updateError } = await supabase
          .from("applications")
          .update(payload)
          .eq("id", initialData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("applications")
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
        <div className="p-3.5 rounded-xl bg-rose/5 border border-rose/10 text-rose text-sm leading-relaxed">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink-light mb-1.5">
          Name <span className="text-rose">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. ESKAS Swiss Excellence"
          value={name ?? ""}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            University
          </label>
          <input
            type="text"
            value={university ?? ""}
            onChange={(e) => setUniversity(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            Country
          </label>
          <input
            type="text"
            value={country ?? ""}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            Program
          </label>
          <input
            type="text"
            value={program ?? ""}
            onChange={(e) => setProgram(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            Funding Body
          </label>
          <input
            type="text"
            value={fundingBody ?? ""}
            onChange={(e) => setFundingBody(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            Open Date
          </label>
          <input
            type="date"
            value={openDate ?? ""}
            onChange={(e) => setOpenDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            Deadline
          </label>
          <input
            type="date"
            value={deadline ?? ""}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-light mb-1.5">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Application["status"])}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-light mb-1.5">
          Reminder
        </label>
        <button
          type="button"
          onClick={() => setReminder(!reminder)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
            reminder
              ? "bg-gold/5 border-gold/20 text-gold"
              : "bg-white border-border text-ink-light hover:bg-cream"
          }`}
        >
          <Bell size={18} fill={reminder ? "currentColor" : "none"} />
          Remind me before deadline
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-light mb-1.5">
          Notes
        </label>
        <textarea
          rows={4}
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 text-sm font-medium text-ink-light border border-border rounded-xl hover:bg-cream transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-hover transition-all duration-200 disabled:opacity-50 shadow-warm"
        >
          {saving
            ? "Saving..."
            : initialData
            ? "Update Application"
            : "Add Application"}
        </button>
      </div>
    </form>
  );
}
