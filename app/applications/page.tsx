"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Application } from "@/types";
import { formatDate, daysUntil, deadlineColor } from "@/lib/utils";
import Drawer from "@/components/ui/Drawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import QuickAddModal from "@/components/ui/QuickAddModal";
import ApplicationForm from "@/components/applications/ApplicationForm";
import { Plus, Search, Trash2, Edit3, Download, Wand2, ArrowRight } from "lucide-react";

const filterPills = [
  { label: "All", value: "all" },
  { label: "Applied", value: "Applied" },
  { label: "Accepted", value: "Accepted" },
  { label: "Rejected", value: "Rejected" },
  { label: "Waitlisted", value: "Waitlisted" },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Application | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<Application>>();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("archived", false)
      .neq("status", "Awaiting Result")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApplications(data as Application[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Remove the search from filter pills — filter pills are status-only
  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      (app.university ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (app.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (app.funding_body ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "all" || app.status === filter;

    return matchesSearch && matchesFilter;
  });

  function openCreate() {
    setEditing(undefined);
    setPrefillData(undefined);
    setDrawerOpen(true);
  }

  function openEdit(app: Application) {
    setEditing(app);
    setDrawerOpen(true);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("applications")
      .update({ archived: true })
      .eq("id", id);

    if (!error) {
      setConfirmDelete(null);
      fetchApplications();
    }
  }

  function handleMoveToAwaiting(id: string) {
    console.log("[handleMoveToAwaiting] Fired for id:", id);
    const statusValue = "Awaiting Result";
    console.log("[handleMoveToAwaiting] Writing status:", statusValue);
    supabase
      .from("applications")
      .update({ status: statusValue })
      .eq("id", id)
      .then(({ error, data }) => {
        if (error) {
          console.error("[handleMoveToAwaiting] Storage write FAILED:", error);
          fetchApplications();
        } else {
          console.log("[handleMoveToAwaiting] Storage write succeeded:", { data });
          setApplications((prev) => prev.filter((app) => app.id !== id));
        }
      });
  }

  async function handleQuickAdd(rawText: string) {
    setQuickAddLoading(true);
    setQuickAddError(null);

    try {
      const response = await fetch("/api/parse-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, type: "application" }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Parsing failed");

      setQuickAddOpen(false);
      setPrefillData(data.parsed);
      setEditing(undefined);
      setDrawerOpen(true);
    } catch (err) {
      setQuickAddError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setQuickAddLoading(false);
    }
  }

  async function handleExportCSV() {
    const headers = ["Name", "University", "Country", "Program", "Funding Body", "Open Date", "Deadline", "Status", "Notes"];
    const rows = filtered.map((app) => [
      app.name,
      app.university ?? "",
      app.country ?? "",
      app.program ?? "",
      app.funding_body ?? "",
      app.open_date ?? "",
      app.deadline ?? "",
      app.status,
      app.notes ?? "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
            Applications
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {applications.length} application{applications.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
          >
            <Download size={15} />
            Export
          </button>
          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-600 bg-white rounded-xl border border-indigo-200 shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all duration-200"
          >
            <Wand2 size={15} />
            Quick Add
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            <Plus size={18} />
            Add Application
          </button>
        </div>
      </div>

      {/* Search + Filter Pills */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2.5 bg-white border-gray-200 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {filterPills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setFilter(pill.value)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                filter === pill.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              {pill.label}
            </button>
          ))}
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
                search || filter !== "all"
                  ? "No applications match your filters."
                  : "You haven't added any applications yet."
              }
              actionLabel="Add Application"
              onAction={openCreate}
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
                  <th className="text-right px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((app) => {
                  const days = app.deadline ? daysUntil(app.deadline) : null;
                  const dColor = app.deadline ? deadlineColor(days!) : "green";

                  return (
                    <tr key={app.id} className="row-hover">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {days !== null && days <= 7 && (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              dColor === "red" ? "bg-rose" : dColor === "amber" ? "bg-gold" : "bg-sage"
                            }`} />
                          )}
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
                              <p className={`text-xs ${
                                dColor === "red" ? "text-rose" : dColor === "amber" ? "text-gold" : "text-sage"
                              } font-medium`}>
                                {days < 0
                                  ? `${Math.abs(days)} days ago`
                                  : days === 0
                                  ? "Today"
                                  : `${days} days left`}
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
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {app.status === "Applied" && days !== null && days < 0 && (
                            <button
                              onClick={() => handleMoveToAwaiting(app.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100 transition-all duration-200"
                              title="Move to Awaiting Result"
                            >
                              <ArrowRight size={13} />
                              Awaiting
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(app)}
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                            aria-label="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(app.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200"
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
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

      {/* Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Application" : "Add Application"}>
        <ApplicationForm
          key={editing?.id ?? "new"}
          initialData={editing}
          prefillData={prefillData}
          onSave={() => { setDrawerOpen(false); fetchApplications(); }}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        message="Are you sure you want to archive this application?"
      />

      {/* Quick Add */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => { setQuickAddOpen(false); setQuickAddError(null); }}
        onParse={handleQuickAdd}
        loading={quickAddLoading}
        error={quickAddError}
      />
    </div>
  );
}
