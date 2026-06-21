"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Application } from "@/types";
import { daysUntil, deadlineColor, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer from "@/components/ui/Drawer";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import ApplicationForm from "@/components/applications/ApplicationForm";
import {
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Search,
  Wand2,
  FileText,
} from "lucide-react";
import QuickAddModal from "@/components/ui/QuickAddModal";

const statusFilters = ["All", "Applied", "Accepted", "Rejected", "Waitlisted"];

const dotColorClass: Record<"red" | "amber" | "green", string> = {
  red: "bg-glow-rose shadow-glow-rose",
  amber: "bg-glow-amber shadow-glow-amber",
  green: "bg-glow-teal shadow-glow-teal",
};

function isOpeningSoon(openDate: string | null): boolean {
  if (!openDate) return false;
  const days = daysUntil(openDate);
  return days >= 0 && days <= 30;
}

function extractStipend(notes: string | null): string | null {
  if (!notes) return null;
  const match =
    notes.match(/(?:€|CHF)\s*[\d.,]+/i) ||
    notes.match(/[\d.,]+\s*(?:€|CHF)/i);
  return match ? match[0].trim() : null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<
    Application | undefined
  >();

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveApplication, setArchiveApplication] =
    useState<Application | null>(null);
  const [archiveLessons, setArchiveLessons] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteApplication, setDeleteApplication] =
    useState<Application | null>(null);

  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [unarchiveApplication, setUnarchiveApplication] =
    useState<Application | null>(null);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<Application> | undefined>();

  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function fetchApplications() {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("deadline", { ascending: true });

    if (!error && data) {
      setApplications(data as Application[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchApplications();
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

  const activeApplications = applications.filter((a) => !a.archived);
  const archivedApplications = applications.filter((a) => a.archived);

  const filteredApplications = activeApplications.filter((a) => {
    const query = search.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(query) ||
      (a.university ?? "").toLowerCase().includes(query) ||
      (a.funding_body ?? "").toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApplications.length / 10);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  function handleAdd() {
    setEditingApplication(undefined);
    setDrawerOpen(true);
  }

  function handleEdit(application: Application) {
    setEditingApplication(application);
    setDrawerOpen(true);
    setOpenMenuId(null);
  }

  function handleArchiveClick(application: Application) {
    setArchiveApplication(application);
    setArchiveLessons("");
    setArchiveModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleArchiveConfirm() {
    if (!archiveApplication) return;

    await supabase
      .from("applications")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        lessons: archiveLessons,
      })
      .eq("id", archiveApplication.id);

    setArchiveModalOpen(false);
    setArchiveApplication(null);
    fetchApplications();
  }

  function handleDeleteClick(application: Application) {
    setDeleteApplication(application);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteApplication) return;

    await supabase
      .from("applications")
      .delete()
      .eq("id", deleteApplication.id);

    setDeleteModalOpen(false);
    setDeleteApplication(null);
    fetchApplications();
  }

  function handleUnarchiveClick(application: Application) {
    setUnarchiveApplication(application);
    setUnarchiveModalOpen(true);
  }

  async function handleUnarchiveConfirm() {
    if (!unarchiveApplication) return;

    await supabase
      .from("applications")
      .update({
        archived: false,
        archived_at: null,
      })
      .eq("id", unarchiveApplication.id);

    setUnarchiveModalOpen(false);
    setUnarchiveApplication(null);
    fetchApplications();
  }

  function handleSave() {
    setDrawerOpen(false);
    setEditingApplication(undefined);
    setPrefillData(undefined);
    fetchApplications();
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
        body: JSON.stringify({ text, type: "application" }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Parsing failed");
      }

      setQuickAddOpen(false);
      setEditingApplication(undefined);
      setPrefillData(data as Partial<Application>);
      setDrawerOpen(true);
    } catch {
      setQuickAddError("Could not parse — please fill the form manually");
    } finally {
      setQuickAddLoading(false);
    }
  }

  async function handleGenerateReport() {
    setReportLoading(true);
    try {
      const list = activeApplications
        .map(
          (a) =>
            `${a.name} (country: ${a.country || "unknown"}, status: ${a.status}, deadline: ${a.deadline || "none"})`
        )
        .join("; ");

      const prompt = `You are a PhD application assistant. Generate a short application report (max 150 words) based on this data. Plain text only, no markdown, no bullet points.

Cover these points:
1. How many applications per country
2. How many deadlines have already passed
3. How many deadlines are coming up in the next 30 days
4. Which applications are rejected
5. One sentence on what to focus on now

Applications: ${list || "none"}`;

      const response = await fetch("/api/groq-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Report failed");

      setReportText(result.text);
      setReportOpen(true);
    } catch (err) {
      setReportText(
        err instanceof Error ? err.message : "Could not generate report"
      );
      setReportOpen(true);
    } finally {
      setReportLoading(false);
    }
  }

  function renderDeadline(deadline: string | null) {
    if (!deadline) return <span className="text-sm text-white/20">—</span>;

    const days = daysUntil(deadline);
    const color = deadlineColor(days);

    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColorClass[color]}`} />
        <div className="flex flex-col">
          <span className="text-sm text-white/70">{formatDate(deadline)}</span>
          <span className="text-xs text-white/40">
            {days < 0 ? `${Math.abs(days)} days ago` : `${days} days left`}
          </span>
        </div>
      </div>
    );
  }

  function renderActions(application: Application) {
    const isOpen = openMenuId === application.id;

    return (
      <div className="relative" data-menu="true">
        <button
          onClick={() => setOpenMenuId(isOpen ? null : application.id)}
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
                handleEdit(application);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                handleArchiveClick(application);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={() => {
                handleDeleteClick(application);
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
          <span className="gradient-text">A</span>pplications
        </h1>
        <p className="text-white/30 text-sm mt-2">
          PhD programs and funding opportunities you are tracking.
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
              placeholder="Search name, university, or funding body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl"
            />
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {reportLoading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
            )}
            <FileText size={16} />
            Generate Report
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
            + Add Application
          </button>
        </div>
      </div>

      {(() => {
        const statusCounts = activeApplications.reduce<Record<string, number>>(
          (acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
          },
          {}
        );
        const allCount = activeApplications.length;

        return (
          <div className="flex flex-wrap gap-2 mb-6">
            {statusFilters
              .filter((s) => {
                if (s === "All") return true;
                return (statusCounts[s] || 0) > 0;
              })
              .map((s) => {
                const count = s === "All" ? allCount : statusCounts[s] || 0;
                return (
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
                    {s} ({count})
                  </button>
                );
              })}
          </div>
        );
      })()}

      {loading ? (
        <div className="text-white/40 text-sm animate-pulse">Loading applications...</div>
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          message="No applications found."
          actionLabel="Add Application"
          onAction={handleAdd}
        />
      ) : (
        <>
          {reportOpen && reportText && (
            <div className="mb-6 rounded-2xl p-5 relative animate-fadeIn"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                borderLeft: "4px solid #8b5cf6",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                  {reportText}
                </p>
                <button
                  onClick={() => setReportOpen(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Dismiss report"
                >
                  ×
                </button>
              </div>
            </div>
          )}

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
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Program</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Deadline</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Stipend</th>
                  <th className="px-6 py-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {paginatedApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white/80">
                        {application.name}
                      </p>
                      {application.university && (
                        <p className="text-xs text-white/40 mt-0.5">
                          {application.university}
                        </p>
                      )}
                      {isOpeningSoon(application.open_date) && (
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
                      {application.country || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {application.program || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {renderDeadline(application.deadline)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {extractStipend(application.notes) || "—"}
                    </td>
                    <td className="px-6 py-4 text-right relative overflow-visible">
                      {renderActions(application)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {paginatedApplications.map((application) => (
              <div
                key={application.id}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">
                      {application.name}
                    </p>
                    {application.university && (
                      <p className="text-xs text-white/40 mt-0.5">
                        {application.university}
                      </p>
                    )}
                    {isOpeningSoon(application.open_date) && (
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
                  {renderActions(application)}
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Country</span>
                    <span className="text-white/70">{application.country || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Program</span>
                    <span className="text-white/70">{application.program || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Deadline</span>
                    {renderDeadline(application.deadline)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Status</span>
                    <StatusBadge status={application.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Stipend</span>
                    <span className="text-white/70">
                      {extractStipend(application.notes) || "—"}
                    </span>
                  </div>
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

      {/* Archived applications */}
      {archivedApplications.length > 0 && (
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
            Archived ({archivedApplications.length})
          </button>

          {archivedExpanded && (
            <div className="mt-4 space-y-4">
              {archivedApplications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      {application.name} — {application.university || "—"}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      Archived on {formatDate(application.archived_at || "")}
                    </p>
                    {application.lessons && (
                      <p className="text-sm text-white/50 mt-2 leading-relaxed">
                        <span className="font-medium text-white/70">Lessons:</span>{" "}
                        {application.lessons}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start shrink-0">
                    <button
                      onClick={() => handleUnarchiveClick(application)}
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
                      onClick={() => handleDeleteClick(application)}
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
          setEditingApplication(undefined);
          setPrefillData(undefined);
        }}
        title={
          editingApplication
            ? "Edit Application"
            : prefillData
            ? "Quick Add Application"
            : "Add Application"
        }
      >
        <ApplicationForm
          initialData={editingApplication}
          prefillData={prefillData}
          onSave={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      <ConfirmModal
        isOpen={archiveModalOpen}
        onClose={() => {
          setArchiveModalOpen(false);
          setArchiveApplication(null);
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
          setDeleteApplication(null);
        }}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this application?"
      />

      <ConfirmModal
        isOpen={unarchiveModalOpen}
        onClose={() => {
          setUnarchiveModalOpen(false);
          setUnarchiveApplication(null);
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
