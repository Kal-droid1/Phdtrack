"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Supervisor } from "@/types";
import { formatDate } from "@/lib/utils";
import Drawer from "@/components/ui/Drawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import SupervisorForm from "@/components/supervisors/SupervisorForm";
import { Plus, Search, Trash2, Edit3, Download } from "lucide-react";

const filterPills = [
  { label: "All", value: "all" },
  { label: "Sent", value: "Sent" },
  { label: "Interested", value: "Interested" },
  { label: "Declined", value: "Declined" },
  { label: "No Response", value: "No Response" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #06b6d4, #22d3ee)",
    "linear-gradient(135deg, #f59e0b, #fbbf24)",
    "linear-gradient(135deg, #10b981, #34d399)",
    "linear-gradient(135deg, #ef4444, #f87171)",
    "linear-gradient(135deg, #8b5cf6, #a855f7)",
    "linear-gradient(135deg, #ec4899, #f472b6)",
    "linear-gradient(135deg, #6366f1, #06b6d4)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Supervisor | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchSupervisors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("supervisors")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (!error && data) setSupervisors(data as Supervisor[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSupervisors(); }, [fetchSupervisors]);

  const filtered = supervisors.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.university ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  function openCreate() { setEditing(undefined); setDrawerOpen(true); }
  function openEdit(s: Supervisor) { setEditing(s); setDrawerOpen(true); }

  async function handleDelete(id: string) {
    await supabase.from("supervisors").update({ archived: true }).eq("id", id);
    setConfirmDelete(null);
    fetchSupervisors();
  }

  async function handleExportCSV() {
    const headers = ["Name", "Title", "University", "Department", "Email", "Date Contacted", "Status", "Notes"];
    const rows = filtered.map((s) => [
      s.name,
      s.title ?? "",
      s.university ?? "",
      s.department ?? "",
      s.email ?? "",
      s.date_contacted ?? "",
      s.status,
      s.notes ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "supervisors_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
            Supervisors
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {supervisors.length} professor{supervisors.length !== 1 ? "s" : ""} tracked
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
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Plus size={18} />
            Add Professor
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search professors..."
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

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              message={search || filter !== "all" ? "No professors match your filters." : "You haven't added any professors yet."}
              actionLabel="Add Professor"
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">Name</th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">University</th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500 hidden md:table-cell">Contacted</th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500 hidden md:table-cell">Status</th>
                  <th className="text-right px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="row-hover">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                          style={{ background: getGradient(s.name) }}
                        >
                          {getInitials(s.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                          {s.title && <p className="text-xs text-gray-500 truncate">{s.title}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{s.university || "—"}</p>
                      {s.department && <p className="text-xs text-gray-400">{s.department}</p>}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {s.date_contacted ? (
                        <span className="text-sm text-gray-700 tabular-nums">{formatDate(s.date_contacted)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                          aria-label="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(s.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200"
                          aria-label="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Professor" : "Add Professor"}>
        <SupervisorForm
          key={editing?.id ?? "new"}
          initialData={editing}
          onSave={() => { setDrawerOpen(false); fetchSupervisors(); }}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        message="Are you sure you want to archive this professor?"
      />
    </div>
  );
}
