"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Watchlist } from "@/types";
import { daysUntil, formatDate } from "@/lib/utils";
import Drawer from "@/components/ui/Drawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import WatchlistForm from "@/components/watchlist/WatchlistForm";
import {
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Search,
  Wand2,
  Bell,
  BarChart3,
} from "lucide-react";

export default function WatchlistPage() {
  const [items, setItems] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Watchlist | undefined>();
  const [prefillData, setPrefillData] = useState<Partial<Watchlist> | undefined>();

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveItem, setArchiveItem] = useState<Watchlist | null>(null);
  const [archiveLessons, setArchiveLessons] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Watchlist | null>(null);

  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [unarchiveItem, setUnarchiveItem] = useState<Watchlist | null>(null);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .order("expected_open_date", { ascending: true, nullsFirst: false });

    if (!error && data) {
      setItems(data as Watchlist[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeItems = items.filter((i) => !i.archived);
  const archivedItems = items.filter((i) => i.archived);

  const filteredItems = activeItems.filter((i) => {
    const query = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(query) ||
      (i.funding_body ?? "").toLowerCase().includes(query)
    );
  });

  function handleAdd() {
    setEditingItem(undefined);
    setPrefillData(undefined);
    setDrawerOpen(true);
  }

  function handleEdit(item: Watchlist) {
    setEditingItem(item);
    setPrefillData(undefined);
    setDrawerOpen(true);
    setOpenMenuId(null);
  }

  function handleArchiveClick(item: Watchlist) {
    setArchiveItem(item);
    setArchiveLessons("");
    setArchiveModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleArchiveConfirm() {
    if (!archiveItem) return;

    await supabase
      .from("watchlist")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        lessons: archiveLessons,
      })
      .eq("id", archiveItem.id);

    setArchiveModalOpen(false);
    setArchiveItem(null);
    fetchItems();
  }

  function handleDeleteClick(item: Watchlist) {
    setDeleteItem(item);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteItem) return;

    await supabase
      .from("watchlist")
      .delete()
      .eq("id", deleteItem.id);

    setDeleteModalOpen(false);
    setDeleteItem(null);
    fetchItems();
  }

  function handleUnarchiveClick(item: Watchlist) {
    setUnarchiveItem(item);
    setUnarchiveModalOpen(true);
  }

  async function handleUnarchiveConfirm() {
    if (!unarchiveItem) return;

    await supabase
      .from("watchlist")
      .update({
        archived: false,
        archived_at: null,
      })
      .eq("id", unarchiveItem.id);

    setUnarchiveModalOpen(false);
    setUnarchiveItem(null);
    fetchItems();
  }

  async function handleAnalyzePriorities() {
    setAnalysisLoading(true);
    try {
      const list = activeItems
        .map(
          (i) =>
            `${i.name} (expected_open_date: ${i.expected_open_date || "unknown"}, expected_deadline: ${i.expected_deadline || "none"}, notes: ${i.notes || "none"})`
        )
        .join("; ");

      const prompt = `You are a PhD application advisor. Look at this watchlist of upcoming scholarships and programs not yet open. Tell the user in plain text (max 100 words) which ones to prioritize preparing for, which deadlines are approaching, and what they should do now to be ready. Be specific with names and dates. No markdown, no bullet points.

Watchlist items: ${list || "none"}`;

      const response = await fetch("/api/groq-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis failed");

      setAnalysisText(result.text);
      setAnalysisOpen(true);
    } catch (err) {
      setAnalysisText(
        err instanceof Error ? err.message : "Could not analyze priorities"
      );
      setAnalysisOpen(true);
    } finally {
      setAnalysisLoading(false);
    }
  }

  function handleSave() {
    setDrawerOpen(false);
    setEditingItem(undefined);
    setPrefillData(undefined);
    fetchItems();
  }

  function handleQuickAdd() {
    setQuickAddText("");
    setQuickAddError(null);
    setQuickAddOpen(true);
  }

  async function handleQuickAddParse() {
    setQuickAddLoading(true);
    setQuickAddError(null);

    try {
      const prompt = `Extract fields from this text and return ONLY a JSON object.
Fields: name, funding_body, country, expected_open_date (YYYY-MM-DD or null), expected_deadline (YYYY-MM-DD or null), url, notes
Text: ${quickAddText}`;

      const response = await fetch("/api/groq-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Parsing failed");
      }

      const clean = result.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      Object.keys(parsed).forEach((key) => {
        if (parsed[key] === "null" || parsed[key] === "undefined") {
          parsed[key] = null;
        }
      });

      setQuickAddOpen(false);
      setEditingItem(undefined);
      setPrefillData(parsed as Partial<Watchlist>);
      setDrawerOpen(true);
    } catch {
      setQuickAddError("Could not parse — please fill the form manually");
    } finally {
      setQuickAddLoading(false);
    }
  }

  function isOpeningSoon(date: string | null): boolean {
    if (!date) return false;
    const days = daysUntil(date);
    return days >= 0 && days <= 30;
  }

  function renderExpectedOpen(openDate: string | null) {
    if (!openDate) return <span className="text-sm text-white/20">—</span>;

    const days = daysUntil(openDate);
    const isSoon = days >= 0 && days <= 30;

    return (
      <div className="flex flex-col">
        <span className="text-sm text-white/70">{formatDate(openDate)}</span>
        {isSoon && (
          <span className="text-xs font-medium"
            style={{
              color: "#f59e0b",
              textShadow: "0 0 10px rgba(245, 158, 11, 0.3)",
            }}
          >
            Opens in {days} {days === 1 ? "day" : "days"}
          </span>
        )}
      </div>
    );
  }

  function renderActions(item: Watchlist) {
    const isOpen = openMenuId === item.id;

    return (
      <div className="relative" data-menu="true">
        <button
          onClick={() => setOpenMenuId(isOpen ? null : item.id)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/30"
          aria-label="Open actions"
        >
          <MoreVertical size={18} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-32 rounded-xl py-1 z-50 overflow-hidden animate-fadeIn"
            style={{
              background: "#0f0f17",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <button
              onClick={() => {
                handleEdit(item);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                handleArchiveClick(item);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={() => {
                handleDeleteClick(item);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-glow-rose hover:bg-white/5 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-syne">
          <span className="gradient-text">W</span>atchlist
        </h1>
        <p className="text-white/30 text-sm mt-2">
          Scholarships and programs opening soon that you are monitoring.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search name or funding body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl"
            />
          </div>

          <button
            onClick={handleAnalyzePriorities}
            disabled={analysisLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              color: "#f59e0b",
            }}
          >
            {analysisLoading && (
              <span className="w-4 h-4 border-2 border-glow-amber border-t-transparent rounded-full animate-spin" />
            )}
            <BarChart3 size={16} />
            Analyze Priorities
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <Wand2 size={16} />
            Quick Add
          </button>
          <button
            onClick={handleAdd}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #14b8a6)",
              boxShadow: "0 0 20px rgba(139,92,246,0.2)",
            }}
          >
            + Add to Watchlist
          </button>
        </div>
      </div>

      {analysisOpen && analysisText && (
        <div className="mb-6 rounded-2xl p-5 relative animate-fadeIn"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            borderLeft: "4px solid #f59e0b",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            borderRight: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
              {analysisText}
            </p>
            <button
              onClick={() => setAnalysisOpen(false)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss analysis"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-white/40 text-sm animate-pulse">Loading watchlist...</div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          message="No items in your watchlist."
          actionLabel="Add to Watchlist"
          onAction={handleAdd}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl overflow-visible"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Country</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Expected Open</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Expected Deadline</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Reminder</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Notes</th>
                  <th className="px-6 py-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white/80">
                        {item.name}
                      </p>
                      {item.funding_body && (
                        <p className="text-xs text-white/40 mt-0.5">
                          {item.funding_body}
                        </p>
                      )}
                      {isOpeningSoon(item.expected_open_date) && (
                        <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            background: "rgba(245, 158, 11, 0.1)",
                            border: "1px solid rgba(245, 158, 11, 0.2)",
                            color: "#f59e0b",
                            boxShadow: "0 0 10px rgba(245, 158, 11, 0.2)",
                          }}
                        >
                          Opening soon
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {item.country || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {renderExpectedOpen(item.expected_open_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {item.expected_deadline
                        ? formatDate(item.expected_deadline)
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {item.reminder ? (
                        <Bell
                          size={18}
                          style={{ color: "#f59e0b" }}
                          fill="currentColor"
                        />
                      ) : (
                        <Bell size={18} className="text-white/20" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50 max-w-[200px] truncate">
                      {item.notes || "—"}
                    </td>
                    <td className="px-6 py-4 text-right relative overflow-visible">
                      {renderActions(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80">
                      {item.name}
                    </p>
                    {item.funding_body && (
                      <p className="text-xs text-white/40 mt-0.5">
                        {item.funding_body}
                      </p>
                    )}
                    {isOpeningSoon(item.expected_open_date) && (
                      <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          background: "rgba(245, 158, 11, 0.1)",
                          border: "1px solid rgba(245, 158, 11, 0.2)",
                          color: "#f59e0b",
                          boxShadow: "0 0 10px rgba(245, 158, 11, 0.2)",
                        }}
                      >
                        Opening soon
                      </span>
                    )}
                  </div>
                  {renderActions(item)}
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Country</span>
                    <span className="text-white/70">{item.country || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Expected Open</span>
                    {renderExpectedOpen(item.expected_open_date)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Deadline</span>
                    <span className="text-white/70">
                      {item.expected_deadline
                        ? formatDate(item.expected_deadline)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Reminder</span>
                    {item.reminder ? (
                      <Bell
                        size={16}
                        style={{ color: "#f59e0b" }}
                        fill="currentColor"
                      />
                    ) : (
                      <Bell size={16} className="text-white/20" />
                    )}
                  </div>
                  {item.notes && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/40">Notes</span>
                      <span className="text-white/50 max-w-[200px] truncate text-right">
                        {item.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Archived items */}
      {archivedItems.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setArchivedExpanded(!archivedExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
          >
            {archivedExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
            Archived ({archivedItems.length})
          </button>

          {archivedExpanded && (
            <div className="mt-4 space-y-4">
              {archivedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      {item.name}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      Archived on {formatDate(item.archived_at || "")}
                    </p>
                    {item.lessons && (
                      <p className="text-sm text-white/50 mt-2 leading-relaxed">
                        <span className="font-medium text-white/70">Lessons:</span>{" "}
                        {item.lessons}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start shrink-0">
                    <button
                      onClick={() => handleUnarchiveClick(item)}
                      className="px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all duration-200"
                      style={{
                        color: "#14b8a6",
                        border: "1px solid rgba(20, 184, 166, 0.2)",
                        background: "rgba(20, 184, 166, 0.05)",
                      }}
                    >
                      Unarchive
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all duration-200"
                      style={{
                        color: "#f43f5e",
                        border: "1px solid rgba(244, 63, 94, 0.2)",
                        background: "rgba(244, 63, 94, 0.05)",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingItem(undefined);
          setPrefillData(undefined);
        }}
        title={
          editingItem
            ? "Edit Watchlist Entry"
            : prefillData
            ? "Quick Add to Watchlist"
            : "Add to Watchlist"
        }
      >
        <WatchlistForm
          initialData={editingItem}
          prefillData={prefillData}
          onSave={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      {/* Quick Add Modal */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setQuickAddOpen(false)}
            aria-hidden="true"
          />

          <div
            className="relative z-50 w-full max-w-md rounded-2xl p-6"
            style={{
              background: "#0f0f17",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white/80 tracking-tight">
                Quick Add
              </h2>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <p className="text-sm text-white/40 mb-3 leading-relaxed">
              Describe the scholarship or program in plain text and let AI fill the form.
            </p>

            <textarea
              rows={5}
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              placeholder="e.g. DAAD Scholarship for Germany opens January 2025, funding body DAAD..."
              className="w-full rounded-xl px-3.5 py-2.5 text-sm resize-none"
            />

            {quickAddError && (
              <div className="mt-3 text-sm rounded-xl p-3 text-glow-rose"
                style={{
                  background: "rgba(244, 63, 94, 0.1)",
                  border: "1px solid rgba(244, 63, 94, 0.2)",
                }}
              >
                {quickAddError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => setQuickAddOpen(false)}
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
                onClick={handleQuickAddParse}
                disabled={quickAddLoading || !quickAddText.trim()}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #14b8a6)",
                }}
              >
                {quickAddLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wand2 size={18} />
                )}
                {quickAddLoading ? "Parsing..." : "Parse with AI"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={archiveModalOpen}
        onClose={() => {
          setArchiveModalOpen(false);
          setArchiveItem(null);
        }}
        onConfirm={handleArchiveConfirm}
        message="What did you learn from this?"
      >
        <textarea
          rows={4}
          value={archiveLessons}
          onChange={(e) => setArchiveLessons(e.target.value)}
          placeholder="Write your lessons learned..."
          className="w-full rounded-xl px-3.5 py-2.5 text-sm resize-none"
        />
      </ConfirmModal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this item?"
      />

      <ConfirmModal
        isOpen={unarchiveModalOpen}
        onClose={() => {
          setUnarchiveModalOpen(false);
          setUnarchiveItem(null);
        }}
        onConfirm={handleUnarchiveConfirm}
        message="Move this back to your active list?"
      />
    </div>
  );
}
