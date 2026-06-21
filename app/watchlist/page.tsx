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
} from "lucide-react";

const typeFilters = ["All", "Scholarship", "PhD Program", "Fellowship"];

const typeStyles: Record<string, string> = {
  Scholarship: "bg-blue-100 text-blue-700",
  "PhD Program": "bg-purple-100 text-purple-700",
  Fellowship: "bg-green-100 text-green-700",
};

export default function WatchlistPage() {
  const [items, setItems] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
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
    const matchesSearch =
      i.name.toLowerCase().includes(query) ||
      (i.funding_body ?? "").toLowerCase().includes(query);
    const matchesType = typeFilter === "All" || i.type === typeFilter;
    return matchesSearch && matchesType;
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
Fields: name, type (one of: Scholarship/PhD Program/Fellowship), funding_body, country, expected_open_date (YYYY-MM-DD or null), expected_deadline (YYYY-MM-DD or null), url, notes
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
    if (!openDate) return <span className="text-sm text-gray-400">—</span>;

    const days = daysUntil(openDate);
    const isSoon = days >= 0 && days <= 30;

    return (
      <div className="flex flex-col">
        <span className="text-sm text-gray-700">{formatDate(openDate)}</span>
        {isSoon && (
          <span className="text-xs text-amber-600 font-medium">
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
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          aria-label="Open actions"
        >
          <MoreVertical size={18} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={() => {
                handleEdit(item);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => {
                handleArchiveClick(item);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Archive
            </button>
            <button
              onClick={() => {
                handleDeleteClick(item);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2d3436]">
          Watchlist
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Scholarships and programs opening soon that you are monitoring.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search name or funding body..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4a7c59] bg-white border border-[#4a7c59] rounded-md hover:bg-[#4a7c59]/5 transition-colors"
          >
            <Wand2 size={18} />
            Quick Add
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 text-sm font-medium text-white bg-[#4a7c59] rounded-md hover:bg-[#3e6b4b] transition-colors"
          >
            + Add to Watchlist
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {typeFilters.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              typeFilter === t
                ? "bg-[#4a7c59] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading watchlist...</div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          message="No items in your watchlist."
          actionLabel="Add to Watchlist"
          onAction={handleAdd}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-visible">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Country
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Expected Open
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Expected Deadline
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Reminder
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase w-16">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#2d3436]">
                          {item.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            typeStyles[item.type] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      {item.funding_body && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.funding_body}
                        </p>
                      )}
                      {isOpeningSoon(item.expected_open_date) && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Opening soon
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#2d3436]">
                      {item.country || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {renderExpectedOpen(item.expected_open_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.expected_deadline
                        ? formatDate(item.expected_deadline)
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {item.reminder ? (
                        <Bell
                          size={18}
                          className="text-amber-500"
                          fill="currentColor"
                        />
                      ) : (
                        <Bell size={18} className="text-gray-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
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
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#2d3436]">
                        {item.name}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          typeStyles[item.type] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    {item.funding_body && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.funding_body}
                      </p>
                    )}
                    {isOpeningSoon(item.expected_open_date) && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Opening soon
                      </span>
                    )}
                  </div>
                  {renderActions(item)}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Country</span>
                    <span className="text-gray-700">
                      {item.country || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Expected Open</span>
                    {renderExpectedOpen(item.expected_open_date)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Deadline</span>
                    <span className="text-gray-700">
                      {item.expected_deadline
                        ? formatDate(item.expected_deadline)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Reminder</span>
                    {item.reminder ? (
                      <Bell
                        size={16}
                        className="text-amber-500"
                        fill="currentColor"
                      />
                    ) : (
                      <Bell size={16} className="text-gray-300" />
                    )}
                  </div>
                  {item.notes && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Notes</span>
                      <span className="text-gray-700 max-w-[200px] truncate text-right">
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
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
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
                  className="bg-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Archived on {formatDate(item.archived_at || "")}
                    </p>
                    {item.lessons && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Lessons:</span>{" "}
                        {item.lessons}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => handleUnarchiveClick(item)}
                      className="px-3 py-1.5 text-sm font-medium text-green-700 border border-green-200 rounded-md hover:bg-green-50 transition-colors"
                    >
                      Unarchive
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setQuickAddOpen(false)}
            aria-hidden="true"
          />

          <div
            className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg p-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#2d3436]">
                Quick Add
              </h2>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Describe the scholarship or program in plain text and let AI fill
              the form.
            </p>

            <textarea
              rows={5}
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              placeholder='e.g. DAAD Scholarship for Germany opens January 2025, funding body DAAD...'
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent resize-none"
            />

            {quickAddError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-md p-2">
                {quickAddError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => setQuickAddOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddParse}
                disabled={quickAddLoading || !quickAddText.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#4a7c59] rounded-md hover:bg-[#3e6b4b] transition-colors disabled:opacity-50"
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
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59] focus:border-transparent resize-none"
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
