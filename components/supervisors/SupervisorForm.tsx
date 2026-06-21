"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Supervisor } from "@/types";

const statuses = ["Sent", "Interested", "Declined", "No Response"];

interface SupervisorFormProps {
  initialData?: Supervisor;
  prefillData?: Partial<Supervisor>;
  onSave: () => void;
  onClose: () => void;
}

export default function SupervisorForm({
  initialData,
  prefillData,
  onSave,
  onClose,
}: SupervisorFormProps) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [dateContacted, setDateContacted] = useState("");
  const [status, setStatus] = useState("Sent");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTitle(initialData.title);
      setUniversity(initialData.university);
      setDepartment(initialData.department);
      setEmail(initialData.email);
      setDateContacted(
        initialData.date_contacted ? initialData.date_contacted.slice(0, 10) : ""
      );
      setStatus(initialData.status);
      setNotes(initialData.notes);
    } else if (prefillData) {
      setName(prefillData.name ?? "");
      setTitle(prefillData.title ?? "");
      setUniversity(prefillData.university ?? "");
      setDepartment(prefillData.department ?? "");
      setEmail(prefillData.email ?? "");
      setDateContacted(
        prefillData.date_contacted ? prefillData.date_contacted.slice(0, 10) : ""
      );
      setStatus(
        statuses.includes(prefillData.status ?? "") ? prefillData.status! : "Sent"
      );
      setNotes(prefillData.notes ?? "");
    }
  }, [initialData, prefillData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      title,
      university,
      department,
      email,
      date_contacted: dateContacted || null,
      status,
      notes,
    };

    try {
      if (initialData) {
        const { error: updateError } = await supabase
          .from("supervisors")
          .update(payload)
          .eq("id", initialData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("supervisors")
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
        <div className="p-3.5 rounded-xl text-sm leading-relaxed"
          style={{
            color: "#f43f5e",
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-white/50 mb-1.5">
          Name <span style={{ color: "#f43f5e" }}>*</span>
        </label>
        <input
          type="text"
          required
          value={name ?? ""}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/50 mb-1.5">
          Title
        </label>
        <input
          type="text"
          placeholder="e.g. Professor, Dr."
          value={title ?? ""}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/50 mb-1.5">
          University
        </label>
        <input
          type="text"
          value={university ?? ""}
          onChange={(e) => setUniversity(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/50 mb-1.5">
          Department
        </label>
        <input
          type="text"
          value={department ?? ""}
          onChange={(e) => setDepartment(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/50 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email ?? ""}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/50 mb-1.5">
          Date Contacted
        </label>
        <input
          type="date"
          value={dateContacted ?? ""}
          onChange={(e) => setDateContacted(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/50 mb-1.5">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/50 mb-1.5">
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
          className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
          style={{
            color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #14b8a6)",
          }}
        >
          {saving
            ? "Saving..."
            : initialData
            ? "Update Professor"
            : "Add Professor"}
        </button>
      </div>
    </form>
  );
}
