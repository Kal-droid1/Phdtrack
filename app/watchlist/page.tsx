"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Watchlist } from "@/types";
import { formatDate, daysUntil } from "@/lib/utils";
import Drawer from "@/components/ui/Drawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import QuickAddModal from "@/components/ui/QuickAddModal";
import WatchlistForm from "@/components/watchlist/WatchlistForm";
import { Plus, Search, Trash2, Edit3, Download, Wand2, ExternalLink } from "lucide-react";

export default function WatchlistPage() {
  const [items, setItems] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Watchlist | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<Watchlist>>();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (!error && data) setItems(data as Watchlist[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.funding_body ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (item.country ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditing(undefined); setPrefillData(undefined); setDrawerOpen(true); }
  function openEdit(item: Watchlist) { setEditing(item); setDrawerOpen(true); }

  async function handleDelete(id: string) {
    await supabase.from("watchlist").update({ archived: true }).eq("id", id);
    setConfirmDelete(null);
    fetchItems();
  }

  async function handleQuickAdd(rawText: string) {
    setQuickAddLoading(true);
    setQuickAddError(null);

    try {
      const response = await fetch("/api/parse-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, type: "watchlist" }),
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
    const headers = ["Name", "Funding Body", "Country", "Expected Open Date", "Expected Deadline", "URL", "Notes"];
    const rows = filtered.map((item) => [
      item.name,
      item.funding_body ?? "",
      item.country ?? "",
      item.expected_open_date ?? "",
      item.expected_deadline ?? "",
      item.url ?? "",
      item.notes ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "watchlist_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function isOpeningSoon(date: string): boolean {
    const days = daysUntil(date);
    return days >= 0 && days <= 30;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1e1b4b] tracking-tight">
            Watchlist
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""} tracked
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
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Plus size={18} />
            Add to Watchlist
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2.5 bg-white border-gray-200 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              message={search ? "No watchlist items match your search." : "Your watchlist is empty."}
              actionLabel="Add to Watchlist"
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">Name</th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">Body / Country</th>
                  <th className="text-left px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500 hidden md:table-cell">Timeline</th>
                  <th className="text-right px-5 py-4 font-semibold text-[11px] uppercase tracking-[0.12em] text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => {
                  const openingSoon = item.expected_open_date ? isOpeningSoon(item.expected_open_date) : false;
                  return (
                    <tr key={item.id} className="row-hover">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {openingSoon && (
                            <span className="w-2 h-2 rounded-full shrink-0 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            {item.funding_body && <p className="text-xs text-gray-500 truncate">{item.funding_body}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{item.funding_body || "—"}</p>
                        {item.country && <p className="text-xs text-gray-400">{item.country}</p>}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700 tabular-nums">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 mr-1.5">Opens</span>
                            {item.expected_open_date ? formatDate(item.expected_open_date) : <span className="text-gray-300">—</span>}
                          </p>
                          <p className="text-sm text-gray-700 tabular-nums">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 mr-1.5">Deadline</span>
                            {item.expected_deadline ? formatDate(item.expected_deadline) : <span className="text-gray-300">—</span>}
                          </p>
                          {openingSoon && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-700 bg-amber-100 mt-0.5">
                              Opening soon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-200"
                              aria-label="Open link"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                            aria-label="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(item.id)}
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

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Watchlist Item" : "Add to Watchlist"}>
        <WatchlistForm
          key={editing?.id ?? "new"}
          initialData={editing}
          prefillData={prefillData}
          onSave={() => { setDrawerOpen(false); fetchItems(); }}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        message="Are you sure you want to archive this watchlist item?"
      />

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
