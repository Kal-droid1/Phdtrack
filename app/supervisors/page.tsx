"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Supervisor } from "@/types";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer from "@/components/ui/Drawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import SupervisorForm from "@/components/supervisors/SupervisorForm";
import QuickAddModal from "@/components/ui/QuickAddModal";
import { MoreVertical, ChevronDown, ChevronUp, Search, Wand2 } from "lucide-react";

const statusFilters = ["All", "Sent", "Interested", "Declined"];

function getInitials(name: string): string {
  const titles = [
    "prof.",
    "prof",
    "dr.",
    "dr",
    "doctor",
    "professor",
    "mr.",
    "mr",
    "mrs.",
    "mrs",
    "ms.",
    "ms",
    "miss",
  ];
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => !titles.includes(part.toLowerCase()));
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColors(name: string) {
  const gradients = [
    ["#8b5cf6", "#a78bfa"],
    ["#14b8a6", "#5eead4"],
    ["#f59e0b", "#fbbf24"],
    ["#f43f5e", "#fb7185"],
    ["#6366f1", "#818cf8"],
    ["#ec4899", "#f472b6"],
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
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<
    Supervisor | undefined
  >();

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveSupervisor, setArchiveSupervisor] = useState<Supervisor | null>(
    null
  );
  const [archiveLessons, setArchiveLessons] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSupervisor, setDeleteSupervisor] = useState<Supervisor | null>(
    null
  );

  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [unarchiveSupervisor, setUnarchiveSupervisor] =
    useState<Supervisor | null>(null);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<Supervisor> | undefined>();

  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function fetchSupervisors() {
    setLoading(true);
    const { data, error } = await supabase
      .from("supervisors")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSupervisors(data as Supervisor[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSupervisors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

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

  const activeSupervisors = supervisors.filter((s) => !s.archived);
  const archivedSupervisors = supervisors.filter((s) => s.archived);

  const filteredSupervisors = activeSupervisors.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.university.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSupervisors.length / 10);
  const paginatedSupervisors = filteredSupervisors.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  function handleAdd() {
    setEditingSupervisor(undefined);
    setDrawerOpen(true);
  }

  function handleEdit(supervisor: Supervisor) {
    setEditingSupervisor(supervisor);
    setDrawerOpen(true);
    setOpenMenuId(null);
  }

  function handleArchiveClick(supervisor: Supervisor) {
    setArchiveSupervisor(supervisor);
    setArchiveLessons("");
    setArchiveModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleArchiveConfirm() {
    if (!archiveSupervisor) return;

    await supabase
      .from("supervisors")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        lessons: archiveLessons,
      })
      .eq("id", archiveSupervisor.id);

    setArchiveModalOpen(false);
    setArchiveSupervisor(null);
    fetchSupervisors();
  }

  function handleDeleteClick(supervisor: Supervisor) {
    setDeleteSupervisor(supervisor);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteSupervisor) return;

    await supabase.from("supervisors").delete().eq("id", deleteSupervisor.id);

    setDeleteModalOpen(false);
    setDeleteSupervisor(null);
    fetchSupervisors();
  }

  function handleUnarchiveClick(supervisor: Supervisor) {
    setUnarchiveSupervisor(supervisor);
    setUnarchiveModalOpen(true);
  }

  async function handleUnarchiveConfirm() {
    if (!unarchiveSupervisor) return;

    await supabase
      .from("supervisors")
      .update({
        archived: false,
        archived_at: null,
      })
      .eq("id", unarchiveSupervisor.id);

    setUnarchiveModalOpen(false);
    setUnarchiveSupervisor(null);
    fetchSupervisors();
  }

  function handleSave() {
    setDrawerOpen(false);
    setEditingSupervisor(undefined);
    setPrefillData(undefined);
    fetchSupervisors();
  }

  function handleQuickAdd() {
    setQuickAddError(null);
    setPrefillData(undefined);
    setQuickAddOpen(true);
  }

  async function handleParseQuickAdd(text: string) {
    setQuickAddLoading(true);
    setQuickAddError(null);

    try {
      const response = await fetch("/api/parse-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "supervisor" }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Parsing failed");
      }

      setQuickAddOpen(false);
      setEditingSupervisor(undefined);
      setPrefillData(data as Partial<Supervisor>);
      setDrawerOpen(true);
    } catch {
      setQuickAddError("Could not parse — please fill the form manually");
    } finally {
      setQuickAddLoading(false);
    }
  }

  function renderActions(supervisor: Supervisor) {
    const isOpen = openMenuId === supervisor.id;

    return (
      <div className="relative" data-menu="true">
        <button
          onClick={() => setOpenMenuId(isOpen ? null : supervisor.id)}
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
                handleEdit(supervisor);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                handleArchiveClick(supervisor);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={() => {
                handleDeleteClick(supervisor);
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

  function renderAvatar(supervisor: Supervisor) {
    const [from, to] = getAvatarColors(supervisor.name);
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {getInitials(supervisor.name)}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-syne">
          <span className="gradient-text">S</span>upervisor Outreach
        </h1>
        <p className="text-white/30 text-sm mt-2">
          Professors you have contacted about PhD positions.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            placeholder="Search name or university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl"
          />
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
            + Add Professor
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all duration-200 ${
              statusFilter === s
                ? "text-white"
                : "text-white/40 hover:text-white/70"
            }`}
            style={statusFilter === s ? {
              background: "linear-gradient(135deg, #8b5cf6, #14b8a6)",
            } : {
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/40 text-sm animate-pulse">Loading supervisors...</div>
      ) : filteredSupervisors.length === 0 ? (
        <EmptyState
          message="No supervisors found."
          actionLabel="Add Professor"
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
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Name + Title</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">University</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Date Contacted</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Notes</th>
                  <th className="px-6 py-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {paginatedSupervisors.map((supervisor) => (
                  <tr
                    key={supervisor.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {renderAvatar(supervisor)}
                        <div>
                          <p className="text-sm font-medium text-white/80">
                            {supervisor.name}
                          </p>
                          <p className="text-xs text-white/40">
                            {supervisor.title || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {supervisor.university}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {supervisor.date_contacted
                        ? formatDate(supervisor.date_contacted)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {supervisor.email || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={supervisor.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50 max-w-xs truncate">
                      {supervisor.notes || "—"}
                    </td>
                    <td className="px-6 py-4 text-right relative overflow-visible">
                      {renderActions(supervisor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {paginatedSupervisors.map((supervisor) => (
              <div
                key={supervisor.id}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {renderAvatar(supervisor)}
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        {supervisor.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {supervisor.title && `${supervisor.title} • `}
                        {supervisor.university}
                      </p>
                    </div>
                  </div>
                  {renderActions(supervisor)}
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Email</span>
                    <span className="text-white/70">{supervisor.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Contacted</span>
                    <span className="text-white/70">
                      {supervisor.date_contacted
                        ? formatDate(supervisor.date_contacted)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Status</span>
                    <StatusBadge status={supervisor.status} />
                  </div>
                  {supervisor.notes && (
                    <p className="text-sm text-white/50 leading-relaxed">{supervisor.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Previous
              </button>
              <span className="text-sm text-white/40">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Archived supervisors */}
      {archivedSupervisors.length > 0 && (
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
            Archived Supervisors ({archivedSupervisors.length})
          </button>

          {archivedExpanded && (
            <div className="mt-4 space-y-4">
              {archivedSupervisors.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className="rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      {supervisor.name} — {supervisor.university}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      Archived on {formatDate(supervisor.archived_at || "")}
                    </p>
                    {supervisor.lessons && (
                      <p className="text-sm text-white/50 mt-2 leading-relaxed">
                        <span className="font-medium text-white/70">Lessons:</span>{" "}
                        {supervisor.lessons}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start shrink-0">
                    <button
                      onClick={() => handleUnarchiveClick(supervisor)}
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
                      onClick={() => handleDeleteClick(supervisor)}
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
          setEditingSupervisor(undefined);
          setPrefillData(undefined);
        }}
        title={
          editingSupervisor
            ? "Edit Professor"
            : prefillData
            ? "Quick Add Professor"
            : "Add Professor"
        }
      >
        <SupervisorForm
          initialData={editingSupervisor}
          prefillData={prefillData}
          onSave={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      <ConfirmModal
        isOpen={archiveModalOpen}
        onClose={() => {
          setArchiveModalOpen(false);
          setArchiveSupervisor(null);
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
          setDeleteSupervisor(null);
        }}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this supervisor?"
      />

      <ConfirmModal
        isOpen={unarchiveModalOpen}
        onClose={() => {
          setUnarchiveModalOpen(false);
          setUnarchiveSupervisor(null);
        }}
        onConfirm={handleUnarchiveConfirm}
        message="Move this back to your active list?"
      />

      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onParse={handleParseQuickAdd}
        loading={quickAddLoading}
        error={quickAddError}
      />
    </div>
  );
}
