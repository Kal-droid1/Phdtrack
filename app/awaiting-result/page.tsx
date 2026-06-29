"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Application } from "@/types";
import { formatDate, daysUntil } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { Search, Check, X, Clock } from "lucide-react";

export default function AwaitingResultPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("archived", false)
      .eq("status", "Awaiting Result")
      .order("deadline", { ascending: true });

    if (!error && data) {
      setApplications(data as Application[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      !search ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      (app.university ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (app.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (app.funding_body ?? "").toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  async function updateStatus(id: string, status: Application["status"]) {
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id);

    if (!error) {
      fetchApplications();
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
            Awaiting Result
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {applications.length} application{applications.length !== 1 ? "s" : ""} awaiting result
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search awaiting..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2.5 bg-white border-gray-200 rounded-xl"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              message={
                search
                  ? "No awaiting applications match your search."
                  : "No applications awaiting results. Once an application's deadline passes, it will appear here automatically."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">
                    Name
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">
                    University / Body
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500 hidden md:table-cell">
                    Deadline
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500 hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((app) => {
                  const days = app.deadline ? daysUntil(app.deadline) : null;

                  return (
                    <tr key={app.id} className="row-hover">
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {app.name}
                          </p>
                          {app.university && (
                            <p className="text-xs text-gray-500 truncate">
                              {app.university}
                              {app.country ? ` · ${app.country}` : ""}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">
                          {app.funding_body || "—"}
                        </p>
                        {app.program && (
                          <p className="text-xs text-gray-400">{app.program}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        {app.deadline ? (
                          <div>
                            <p className="text-sm text-gray-700 tabular-nums">
                              {formatDate(app.deadline)}
                            </p>
                            {days !== null && (
                              <p className="text-xs text-rose font-medium">
                                {Math.abs(days)} days ago
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateStatus(app.id, "Accepted")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition-all duration-200"
                          >
                            <Check size={13} />
                            Accept
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, "Rejected")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100 transition-all duration-200"
                          >
                            <X size={13} />
                            Reject
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, "Waitlisted")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 transition-all duration-200"
                          >
                            <Clock size={13} />
                            Waitlist
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
